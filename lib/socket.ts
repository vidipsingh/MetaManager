import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, string>();
  private userSockets = new Map<string, string>();
  private activeCalls = new Set<string>(); // Track active calls

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initializeSocket(server: NetServer) {
    if (!this.io) {
      this.io = new SocketIOServer(server, {
        path: '/api/socketio',
        addTrailingSlash: false,
        pingTimeout: 60000,
        pingInterval: 25000,
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket'],
      });

      this.setupSocketEvents();
    }
    return this.io;
  }

  private async disconnectExistingUserSocket(userId: string) {
    const existingSocketId = this.userSockets.get(userId);
    if (existingSocketId) {
      const existingSocket = this.io?.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        console.log(`Disconnecting existing socket ${existingSocketId} for user ${userId}`);
        await existingSocket.disconnect(true);
        this.connectedUsers.delete(existingSocketId);
        this.userSockets.delete(userId);
        // Clean up any active calls for this user
        this.activeCalls.delete(userId);
      }
    }
  }

  private setupSocketEvents() {
    if (!this.io) return;

    this.io.on('connection', async (socket) => {
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        console.log('Rejecting connection - no userId provided');
        socket.disconnect();
        return;
      }

      await this.disconnectExistingUserSocket(userId);

      this.connectedUsers.set(socket.id, userId);
      this.userSockets.set(userId, socket.id);
      
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Broadcast updated user list immediately after new connection
      this.broadcastOnlineUsers();

      socket.on('call-offer', ({ offer, receiverId }) => {
        const callerId = this.connectedUsers.get(socket.id);
        const receiverSocketId = this.userSockets.get(receiverId);
        
        if (!callerId || !receiverSocketId) {
          console.log('Invalid call attempt');
          return;
        }

        if (this.activeCalls.has(receiverId)) {
          socket.emit('call-rejected', { message: 'User is busy' });
          return;
        }

        console.log(`Forwarding call offer from ${callerId} to ${receiverId}`);
        this.activeCalls.add(callerId);
        this.activeCalls.add(receiverId);
        
        this.io?.to(receiverSocketId).emit('call-offer', { 
          offer, 
          callerId 
        });
      });

      socket.on('call-accepted', ({ answer, receiverId }) => {
        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
          this.io?.to(receiverSocketId).emit('call-accepted', { answer });
        }
      });

      socket.on('call-rejected', ({ receiverId }) => {
        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
          this.io?.to(receiverSocketId).emit('call-rejected');
          // Clean up call status
          const callerId = this.connectedUsers.get(socket.id);
          if (callerId) this.activeCalls.delete(callerId);
          this.activeCalls.delete(receiverId);
        }
      });

      socket.on('ice-candidate', ({ candidate, receiverId }) => {
        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
          this.io?.to(receiverSocketId).emit('ice-candidate', { candidate });
        }
      });

      socket.on('call-ended', ({ receiverId }) => {
        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
          this.io?.to(receiverSocketId).emit('call-ended');
          // Clean up call status
          const callerId = this.connectedUsers.get(socket.id);
          if (callerId) this.activeCalls.delete(callerId);
          this.activeCalls.delete(receiverId);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
        const userId = this.connectedUsers.get(socket.id);
        if (userId) {
          this.userSockets.delete(userId);
          this.activeCalls.delete(userId);
        }
        this.connectedUsers.delete(socket.id);
        this.broadcastOnlineUsers();
      });
    });
  }

  private broadcastOnlineUsers() {
    if (this.io) {
      const onlineUserIds = Array.from(new Set(this.connectedUsers.values()));
      console.log('Broadcasting online users:', onlineUserIds);
      this.io.emit('update-users', onlineUserIds);
    }
  }
}