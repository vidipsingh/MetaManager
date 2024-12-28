// app/api/socketio/route.ts
import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

// Create a global variable to store the Socket.IO server instance
let io: Server | null = null;

// Initialize Socket.IO server if it hasn't been initialized yet
if (!io) {
  io = new Server({
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user joining their room
    socket.on('join', (userId: string) => {
      console.log('User joined room:', userId);
      socket.join(userId);
    });

    // Handle sending messages
    socket.on('send-message', (message) => {
      console.log('Message received:', message);

      // Emit to sender's room
      io?.to(message.senderId).emit('new-message', message);

      // Emit to receiver's room
      io?.to(message.receiverId).emit('new-message', message);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export async function GET(req: Request) {
  if (!io) {
    return new NextResponse('Socket server not initialized', { status: 500 });
  }
  return new NextResponse('Socket.IO server is running');
}

// Enable dynamic routing
export const dynamic = 'force-dynamic';

lib/socket-server.ts
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