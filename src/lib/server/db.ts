import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const db = new Database('kanban.db');

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

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
  );
`);

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
