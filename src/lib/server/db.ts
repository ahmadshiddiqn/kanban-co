import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const db = new Database('kanban.db');

// Run migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`);

// Handle tasks table with migrations for existing databases
const tasksColumns = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
const taskColumnNames = tasksColumns.map(c => c.name);

if (!taskColumnNames.includes('due_date')) {
  db.prepare("ALTER TABLE tasks ADD COLUMN due_date DATETIME").run();
}
if (!taskColumnNames.includes('tags')) {
  db.prepare("ALTER TABLE tasks ADD COLUMN tags TEXT").run();
}

// Ensure tasks table exists with all columns
if (!taskColumnNames.includes('id')) {
  db.exec(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      due_date DATETIME,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
    )
  `);
}

// Seed default board if empty
const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get() as { count: number };
if (boardCount.count === 0) {
  const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
  const { lastInsertRowid: boardId } = insertBoard.run('Main Board');

  const insertColumn = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
  const columns = ['To Do', 'In Progress', 'Done'];
  columns.forEach((name, index) => {
    insertColumn.run(boardId, name, index);
  });
}

export default db;

// Database helpers
export const getBoards = () => db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all();

export const getBoard = (id: number) => 
  db.prepare('SELECT * FROM boards WHERE id = ?').get(id);

export const getColumns = (boardId: number) => 
  db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position').all(boardId);

export const getTasks = (columnId: number) => 
  db.prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY position').all(columnId);

export const getTask = (id: number) => 
  db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

export const getBoardData = (boardId: number) => {
  const board = getBoard(boardId);
  if (!board) return null;
  
  const columns = getColumns(boardId);
  const columnsWithTasks = columns.map(col => ({
    ...col,
    tasks: getTasks(col.id)
  }));
  
  return { ...board, columns: columnsWithTasks };
};

export const createTask = (columnId: number, title: string, description?: string, priority = 'medium') => {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM tasks WHERE column_id = ?').get(columnId) as { max: number };
  db.prepare('INSERT INTO tasks (column_id, title, description, position, priority) VALUES (?, ?, ?, ?, ?)').run(columnId, title, description || null, maxPos.max + 1, priority);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(db.prepare('SELECT last_insert_rowid() as id').get().id);
};

export const updateTask = (id: number, data: Partial<{ title: string; description: string; column_id: number; position: number; priority: string }>) => {
  const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE tasks SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
};

export const deleteTask = (id: number) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
};

export const moveTask = (taskId: number, newColumnId: number, newPosition: number) => {
  db.prepare('UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newColumnId, newPosition, taskId);
};

// Subtasks
export const getSubtasks = (taskId: number) =>
  db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position').all(taskId);

export const createSubtask = (taskId: number, title: string) => {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max FROM subtasks WHERE task_id = ?').get(taskId) as { max: number };
  db.prepare('INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)').run(taskId, title, maxPos.max + 1);
  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(db.prepare('SELECT last_insert_rowid() as id').get().id);
  logActivity(taskId, 'subtask_added', `Added subtask: ${title}`);
  return subtask;
};

export const toggleSubtask = (subtaskId: number, taskId: number) => {
  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId) as { completed: number; title: string };
  const newStatus = subtask.completed ? 0 : 1;
  db.prepare('UPDATE subtasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, subtaskId);
  logActivity(taskId, subtask.completed ? 'subtask_uncompleted' : 'subtask_completed', subtask.title);
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
};

export const deleteSubtask = (subtaskId: number, taskId: number) => {
  const subtask = db.prepare('SELECT title FROM subtasks WHERE id = ?').get(subtaskId) as { title: string };
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(subtaskId);
  logActivity(taskId, 'subtask_deleted', `Deleted subtask: ${subtask.title}`);
};

// Activity Log
export const getActivityLog = (taskId: number) =>
  db.prepare('SELECT * FROM activity_log WHERE task_id = ? ORDER BY created_at DESC').all(taskId);

export const logActivity = (taskId: number, action: string, details?: string) => {
  db.prepare('INSERT INTO activity_log (task_id, action, details) VALUES (?, ?, ?)').run(taskId, action, details || null);
};

// Update task with new fields
export const updateTaskExtended = (id: number, data: Partial<{ title: string; description: string; column_id: number; position: number; priority: string; due_date: string | null; tags: string }>) => {
  const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  db.prepare(`UPDATE tasks SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  logActivity(id, 'task_updated', 'Task details updated');
  return task;
};
