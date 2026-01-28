<script lang="ts">
  import type { Task, Subtask, ActivityLogEntry } from '$lib/types';
  
  interface Props {
    task: Task;
    onclose: () => void;
    onupdate: () => void;
  }
  
  let { task, onclose, onupdate }: Props = $props();
  
  let newSubtaskTitle = $state('');
  let editingDesc = $state(false);
  let editedDesc = $state(task.description || '');
  
  async function toggleSubtask(subtask: Subtask) {
    await fetch(`/api/subtasks/${subtask.id}`, { method: 'PUT' });
    onupdate();
  }
  
  async function addSubtask() {
    if (!newSubtaskTitle.trim()) return;
    await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtaskTitle })
    });
    newSubtaskTitle = '';
    onupdate();
  }
  
  async function deleteSubtask(subtaskId: number) {
    if (!confirm('Delete this subtask?')) return;
    await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
    onupdate();
  }
  
  async function saveDescription() {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editedDesc })
    });
    editingDesc = false;
    onupdate();
  }
  
  async function updateDueDate(e: Event) {
    const date = (e.target as HTMLInputElement).value;
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_date: date || null })
    });
    onupdate();
  }
  
  async function updateTags(e: Event) {
    const tags = (e.target as HTMLInputElement).value;
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    onupdate();
  }
  
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }
  
  function getActivityIcon(action: string) {
    if (action.includes('created')) return '📝';
    if (action.includes('updated')) return '✏️';
    if (action.includes('completed')) return '✅';
    if (action.includes('uncompleted')) return '🔲';
    if (action.includes('subtask')) return '📋';
    if (action.includes('moved')) return '➡️';
    return '📌';
  }
  
  // Calculate subtask progress
  function getSubtaskProgress(): string {
    if (!task.subtasks || task.subtasks.length === 0) return '';
    const completed = task.subtasks.filter(s => s.completed).length;
    return `${completed}/${task.subtasks.length}`;
  }
  
  function getSubtaskPercent(): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }
</script>

<div class="modal-overlay" onclick={onclose}>
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>{task.title}</h2>
      <button class="close-btn" onclick={onclose}>×</button>
    </div>
    
    <div class="modal-body">
      <!-- Meta info -->
      <div class="meta-row">
        <span class="priority-badge priority-{task.priority}">{task.priority}</span>
        {#if task.due_date}
          <span class="due-date">📅 Due: {task.due_date}</span>
        {/if}
        <span class="created">Created: {formatDate(task.created_at)}</span>
      </div>
      
      <!-- Description -->
      <div class="section">
        <h3>Description</h3>
        {#if editingDesc}
          <textarea bind:value={editedDesc} rows="3"></textarea>
          <div class="btn-row">
            <button onclick={saveDescription}>Save</button>
            <button onclick={() => editingDesc = false}>Cancel</button>
          </div>
        {:else}
          <p class="description">{task.description || 'No description'}</p>
          <button class="edit-btn" onclick={() => editingDesc = true}>Edit</button>
        {/if}
      </div>
      
      <!-- Due Date & Tags -->
      <div class="section inline-section">
        <div class="field">
          <label>Due Date</label>
          <input 
            type="date" 
            value={task.due_date || ''} 
            onchange={updateDueDate}
          />
        </div>
        <div class="field">
          <label>Tags</label>
          <input 
            type="text" 
            placeholder="work, urgent, ..."
            value={task.tags || ''} 
            onchange={updateTags}
          />
        </div>
      </div>
      
      <!-- Subtasks -->
      <div class="section">
        <h3>
          Subtasks 
          {#if task.subtasks && task.subtasks.length > 0}
            <span class="progress">{getSubtaskProgress()}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {getSubtaskPercent()}%"></div>
            </div>
          {/if}
        </h3>
        
        <div class="subtasks-list">
          {#if task.subtasks}
            {#each task.subtasks as subtask (subtask.id)}
              <div class="subtask-item" class:completed={subtask.completed}>
                <input 
                  type="checkbox" 
                  checked={!!subtask.completed}
                  onchange={() => toggleSubtask(subtask)}
                />
                <span>{subtask.title}</span>
                <button class="delete-subtask" onclick={() => deleteSubtask(subtask.id)}>×</button>
              </div>
            {/each}
          {/if}
        </div>
        
        <div class="add-subtask">
          <input 
            type="text" 
            placeholder="Add subtask..."
            bind:value={newSubtaskTitle}
            onkeydown={(e) => e.key === 'Enter' && addSubtask()}
          />
          <button onclick={addSubtask}>Add</button>
        </div>
      </div>
      
      <!-- Activity Log -->
      <div class="section">
        <h3>Activity Log</h3>
        <div class="activity-list">
          {#if task.activity_log && task.activity_log.length > 0}
            {#each task.activity_log as entry (entry.id)}
              <div class="activity-item">
                <span class="activity-icon">{getActivityIcon(entry.action)}</span>
                <div class="activity-content">
                  <span class="activity-action">{entry.action.replace(/_/g, ' ')}</span>
                  {#if entry.details}
                    <span class="activity-details">{entry.details}</span>
                  {/if}
                  <span class="activity-time">{formatDate(entry.created_at)}</span>
                </div>
              </div>
            {/each}
          {:else}
            <p class="no-activity">No activity yet</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #172b4d;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  
  .priority-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .priority-high { background: #ffebee; color: #c62828; }
  .priority-medium { background: #fff8e1; color: #f57f17; }
  .priority-low { background: #e8f5e9; color: #2e7d32; }
  
  .due-date, .created {
    color: #666;
  }
  
  .section {
    margin-bottom: 24px;
  }
  
  .section h3 {
    font-size: 14px;
    font-weight: 600;
    color: #172b4d;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .inline-section {
    display: flex;
    gap: 20px;
  }
  
  .field {
    flex: 1;
  }
  
  .field label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .field input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dfe1e6;
    border-radius: 6px;
    font-size: 14px;
  }
  
  .description {
    color: #172b4d;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .edit-btn {
    background: none;
    border: none;
    color: #0052cc;
    font-size: 13px;
    cursor: pointer;
    padding: 0;
  }
  
  .edit-btn:hover {
    text-decoration: underline;
  }
  
  .btn-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .btn-row button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }
  
  .btn-row button:first-child {
    background: #0052cc;
    color: white;
  }
  
  .progress {
    font-size: 12px;
    color: #666;
    font-weight: normal;
  }
  
  .progress-bar {
    width: 60px;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #0052cc;
    transition: width 0.3s;
  }
  
  .subtasks-list {
    margin-bottom: 12px;
  }
  
  .subtask-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #f5f5f5;
    border-radius: 6px;
    margin-bottom: 6px;
  }
  
  .subtask-item.completed {
    opacity: 0.6;
  }
  
  .subtask-item.completed span {
    text-decoration: line-through;
  }
  
  .subtask-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  .subtask-item span {
    flex: 1;
    font-size: 14px;
    color: #172b4d;
  }
  
  .delete-subtask {
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .subtask-item:hover .delete-subtask {
    opacity: 1;
  }
  
  .add-subtask {
    display: flex;
    gap: 8px;
  }
  
  .add-subtask input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #dfe1e6;
    border-radius: 6px;
    font-size: 14px;
  }
  
  .add-subtask button {
    padding: 8px 16px;
    background: #0052cc;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .activity-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .activity-item {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .activity-icon {
    font-size: 16px;
  }
  
  .activity-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .activity-action {
    font-size: 13px;
    color: #172b4d;
    text-transform: capitalize;
  }
  
  .activity-details {
    font-size: 12px;
    color: #666;
  }
  
  .activity-time {
    font-size: 11px;
    color: #999;
  }
  
  .no-activity {
    color: #999;
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }
</style>
