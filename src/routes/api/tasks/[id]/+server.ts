import { json } from '@sveltejs/kit';
import { updateTask, updateTaskExtended, deleteTask, moveTask, getSubtasks, getActivityLog } from '$lib/server/db';

export async function GET({ params }) {
  const id = Number(params.id);
  // Import dynamically to avoid circular dependency
  const { getTask } = await import('$lib/server/db');
  const task = getTask(id);
  
  if (task) {
    task.subtasks = getSubtasks(id);
    task.activity_log = getActivityLog(id);
  }
  
  return json(task || { error: 'Task not found' });
}

export async function PUT({ request, params }) {
  const id = Number(params.id);
  const data = await request.json();
  
  if (data.moveToColumn !== undefined && data.newPosition !== undefined) {
    moveTask(id, data.moveToColumn, data.newPosition);
  } else {
    // Check if extended fields are present
    if (data.due_date !== undefined || data.tags !== undefined) {
      updateTaskExtended(id, data);
    } else {
      updateTask(id, data);
    }
  }
  
  return json({ success: true });
}

export async function DELETE({ params }) {
  const id = Number(params.id);
  deleteTask(id);
  return json({ success: true });
}
