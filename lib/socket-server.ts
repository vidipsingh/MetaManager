import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export const getIO = () => io;

export const initializeSocket = (httpServer: NetServer) => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('send-message', async (data) => {
        try {
          io.emit('new-message', data); // Emit new message to all clients
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
};
