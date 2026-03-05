import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // In production, replace with FRONTEND_URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);

    socket.on('join-hub-analytics', (hubId: number) => {
      socket.join(`hub-${hubId}`);
      console.log(`📊 Client ${socket.id} joined analytics for hub: ${hubId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitAnalyticsEvent = (hubId: number, event: string, data: any) => {
  if (io) {
    io.to(`hub-${hubId}`).emit(event, data);
  }
};
