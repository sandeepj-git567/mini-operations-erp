import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { app } from './app';
import { initRealtime } from './services/realtime.service';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

initRealtime(io);

server.listen(PORT, () => {
  console.log(`[Server] Mini Operations ERP backend running on port ${PORT}`);
  console.log(`[Server] Swagger Docs available at http://localhost:${PORT}/api/docs`);
  console.log(`[Server] Health check at http://localhost:${PORT}/api/health`);
});
