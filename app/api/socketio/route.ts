// app/api/socketio/route.ts
import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
  } else {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined`);
      });

      socket.on('send-message', (message) => {
        console.log('Received message:', message);
        // Broadcast to both sender and receiver
        io.to(message.senderId).to(message.receiverId).emit('new-message', message);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};