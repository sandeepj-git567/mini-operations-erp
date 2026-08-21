import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const initRealtime = (io: SocketIOServer) => {
  ioInstance = io;
  io.on('connection', (socket) => {
    console.log(`[Realtime] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Realtime] Client disconnected: ${socket.id}`);
    });
  });
};

export const broadcastEvent = (event: string, data: any) => {
  if (ioInstance) {
    console.log(`[Realtime Broadcaster] Emitting event '${event}'`, data);
    ioInstance.emit(event, {
      type: event,
      payload: data,
      timestamp: new Date().toISOString()
    });
  }
};
