import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
  } else {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
      });

      socket.on('send-message', (message) => {
        console.log('Received send-message:', message);
        // Emit to both sender and receiver rooms
        io.to(message.senderId).emit('new-message', message);
        io.to(message.receiverId).emit('new-message', message);
        console.log(`Emitted new-message to rooms: ${message.senderId}, ${message.receiverId}`);
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