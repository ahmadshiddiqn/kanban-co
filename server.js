import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

app.use(handler);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Kanban server running on port ${PORT}`);
});
