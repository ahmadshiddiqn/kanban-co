import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import { toggleSubtask, deleteSubtask } from '$lib/server/db';

export async function PUT({ params }) {
  const id = Number(params.id);
  const subtask = db.prepare('SELECT task_id FROM subtasks WHERE id = ?').get(id) as { task_id: number };
  if (subtask) {
    toggleSubtask(id, subtask.task_id);
    const updated = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
    return json({ success: true, subtask: updated });
  }
  return json({ error: 'Subtask not found' }, { status: 404 });
}

export async function DELETE({ params }) {
  const id = Number(params.id);
  const subtask = db.prepare('SELECT task_id FROM subtasks WHERE id = ?').get(id) as { task_id: number };
  if (subtask) {
    deleteSubtask(id, subtask.task_id);
    return json({ success: true });
  }
  return json({ error: 'Subtask not found' }, { status: 404 });
}
