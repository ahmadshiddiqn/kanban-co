export interface Board {
  id: number;
  name: string;
  created_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
}

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  activity_log?: ActivityLogEntry[];
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: number;
  task_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithTasks[];
}
