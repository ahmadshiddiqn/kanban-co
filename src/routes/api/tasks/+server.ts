import { json } from '@sveltejs/kit';
import { getBoardData, createTask, updateTask, deleteTask, moveTask } from '$lib/server/db';

export async function GET({ url }) {
  const boardId = Number(url.searchParams.get('board_id')) || 1;
  const board = getBoardData(boardId);
  return json(board || { error: 'Board not found' });
}

export async function POST({ request }) {
  const { column_id, title, description, priority } = await request.json();
  const task = createTask(column_id, title, description, priority);
  return json(task);
}
