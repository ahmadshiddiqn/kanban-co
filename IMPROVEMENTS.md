# Kanban UI Improvements

## Current Issues
- No subtasks support
- Cannot tap to view task details
- No task updates/history information
- Task information display is minimal

## Proposed Improvements

### 1. Subtasks Support
- Add `subtasks` table with parent task reference
- Display subtasks under main task
- Track subtask completion status
- Calculate progress percentage

### 2. Task Detail View
- Modal or slide-out panel on task click
- Show full description
- Show creation date, updates, activity log
- Allow editing from detail view

### 3. Activity/Updates Log
- Track all changes to task (moves, edits, comments)
- Display chronological activity
- Include user/timestamp for each action

### 4. Better Task Information
- Priority indicator (color-coded)
- Due dates (if applicable)
- Assignee (if multi-user)
- Tags/labels

## Technical Notes
- API already supports basic CRUD at `/api/tasks`
- Database schema: `kanban.db` (SQLite)
- Frontend: SvelteKit + Svelte 5

## Status
- [x] Created branch
- [ ] Design mockups
- [ ] Implement backend changes
- [ ] Implement frontend changes
- [ ] Test subtasks
- [ ] Test detail view
- [ ] Create PR

---

*This PR will address usability improvements for better task management.*
