import { json } from '@sveltejs/kit';
import { createSubtask } from '$lib/server/db';

export async function POST({ request, params }) {
  const taskId = Number(params.id);
  const { title } = await request.json();
  
  if (!title || !title.trim()) {
    return json({ error: 'Title is required' }, { status: 400 });
  }
  
  const subtask = createSubtask(taskId, title.trim());
  return json({ success: true, subtask });
}
