import { json } from '@sveltejs/kit';
import { updateTask, deleteTask, moveTask } from '$lib/server/db';

export async function PUT({ request, params }) {
  const id = Number(params.id);
  const data = await request.json();
  
  if (data.moveToColumn !== undefined && data.newPosition !== undefined) {
    moveTask(id, data.moveToColumn, data.newPosition);
  } else {
    updateTask(id, data);
  }
  
  return json({ success: true });
}

export async function DELETE({ params }) {
  const id = Number(params.id);
  deleteTask(id);
  return json({ success: true });
}
