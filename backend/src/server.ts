import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.config';
import { app } from './app';
import { initRealtime } from './services/realtime.service';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

initRealtime(io);

server.listen(env.PORT, () => {
  console.log(`[Server] Mini Operations ERP backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`[Server] Swagger Docs available at http://localhost:${env.PORT}/api/docs`);
  console.log(`[Server] Health check at http://localhost:${env.PORT}/api/health`);
});
