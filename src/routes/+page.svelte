<script lang="ts">
  import { onMount } from 'svelte';
  import type { BoardWithColumns, ColumnWithTasks, Task } from '$lib/types';

  let board = $state<BoardWithColumns | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  // New task form state
  let newTaskTitle = $state('');
  let newTaskDesc = $state('');
  let activeColumn = $state<number | null>(null);
  let newTaskPriority = $state<'low' | 'medium' | 'high'>('medium');

  async function loadBoard() {
    try {
      const res = await fetch('/api/tasks?board_id=1');
      if (!res.ok) throw new Error('Failed to load board');
      board = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function addTask(columnId: number) {
    if (!newTaskTitle.trim()) return;
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id: columnId,
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority
        })
      });
      
      if (res.ok) {
        newTaskTitle = '';
        newTaskDesc = '';
        newTaskPriority = 'medium';
        activeColumn = null;
        await loadBoard();
      }
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  }

  async function deleteTask(taskId: number) {
    if (!confirm('Delete this task?')) return;
    
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      await loadBoard();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  }

  async function updateTaskPriority(task: Task, priority: 'low' | 'medium' | 'high') {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      await loadBoard();
    } catch (e) {
      console.error('Failed to update priority:', e);
    }
  }

  onMount(loadBoard);
</script>

<div class="app">
  <header>
    <h1>📋 Kanban Board</h1>
    {#if board}
      <span class="board-name">{board.name}</span>
    {/if}
  </header>

  {#if loading}
    <div class="loading">Loading board...</div>
  {:else if error}
    <div class="error">❌ {error}</div>
  {:else if board}
    <div class="board">
      {#each board.columns as column (column.id)}
        <div class="column">
          <div class="column-header">
            <h2>{column.name}</h2>
            <span class="task-count">{column.tasks.length}</span>
          </div>
          
          <div class="tasks">
            {#each column.tasks as task (task.id)}
              <div class="task priority-{task.priority}">
                <div class="task-header">
                  <span class="task-title">{task.title}</span>
                  <button class="delete-btn" onclick={() => deleteTask(task.id)}>×</button>
                </div>
                {#if task.description}
                  <p class="task-desc">{task.description}</p>
                {/if}
                <div class="task-footer">
                  <select 
                    value={task.priority} 
                    onchange={(e) => updateTaskPriority(task, e.currentTarget.value)}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
            {/each}
          </div>
          
          <div class="add-task">
            {#if activeColumn === column.id}
              <div class="add-form">
                <input 
                  type="text" 
                  placeholder="Task title"
                  bind:value={newTaskTitle}
                  onkeydown={(e) => e.key === 'Enter' && addTask(column.id)}
                />
                <textarea 
                  placeholder="Description (optional)"
                  bind:value={newTaskDesc}
                  rows="2"
                ></textarea>
                <select bind:value={newTaskPriority}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
                <div class="form-actions">
                  <button onclick={() => addTask(column.id)}>Add</button>
                  <button onclick={() => { activeColumn = null; newTaskTitle = ''; }}>Cancel</button>
                </div>
              </div>
            {:else}
              <button class="add-btn" onclick={() => activeColumn = column.id}>
                + Add Task
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty">No board found</div>
  {/if}
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
  }

  .app {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .board-name {
    background: #e0e0e0;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    color: #666;
  }

  .loading, .error, .empty {
    text-align: center;
    padding: 60px 20px;
    color: #666;
    font-size: 16px;
  }

  .error {
    color: #dc3545;
  }

  .board {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding-bottom: 20px;
  }

  .column {
    background: #ebecf0;
    border-radius: 12px;
    min-width: 320px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 160px);
  }

  .column-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;
  }

  .column-header h2 {
    font-size: 14px;
    font-weight: 600;
    color: #172b4d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .task-count {
    background: #dfe1e6;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    color: #5e6c84;
  }

  .tasks {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .task {
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }

  .task:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .task-title {
    font-size: 14px;
    font-weight: 500;
    color: #172b4d;
    word-break: break-word;
  }

  .delete-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #999;
    cursor: pointer;
    padding: 0 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .task:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: #dc3545;
  }

  .task-desc {
    font-size: 12px;
    color: #5e6c84;
    margin-top: 8px;
    line-height: 1.4;
  }

  .task-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #eee;
  }

  .task-footer select {
    font-size: 11px;
    padding: 4px 8px;
    border: 1px solid #dfe1e6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }

  .priority-high {
    border-left: 3px solid #dc3545;
  }

  .priority-medium {
    border-left: 3px solid #ffc107;
  }

  .priority-low {
    border-left: 3px solid #28a745;
  }

  .add-task {
    padding: 12px;
    border-top: 1px solid #ddd;
  }

  .add-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 2px dashed #c1c7d0;
    border-radius: 8px;
    color: #5e6c84;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: #dfe1e6;
    border-color: #a5adba;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .add-form input,
  .add-form textarea,
  .add-form select {
    padding: 10px;
    border: 1px solid #dfe1e6;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
  }

  .add-form input:focus,
  .add-form textarea:focus,
  .add-form select:focus {
    outline: none;
    border-color: #4c9aff;
  }

  .form-actions {
    display: flex;
    gap: 8px;
  }

  .form-actions button {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .form-actions button:first-child {
    background: #0079bf;
    color: white;
  }

  .form-actions button:first-child:hover {
    background: #026aa7;
  }

  .form-actions button:last-child {
    background: #e4e6ea;
    color: #172b4d;
  }

  .form-actions button:last-child:hover {
    background: #dfe1e6;
  }
</style>
