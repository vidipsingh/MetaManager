// ChatComponent.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Socket, io } from 'socket.io-client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: string;
}

const ChatComponent = () => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure user is authenticated
  useEffect(() => {
    if (!session && status !== "loading") {
      router.push("/login");
      return;
    }

    const fetchAllUsers = async () => {
      try {
        const res = await fetch("/api/getAllUsers");
        if (res.ok) {
          const users = await res.json();
          setAllUsers(users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, [session, status, router]);

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user?.id) return;
  
    const socketInstance = io('http://localhost:3000', {
      path: '/api/socketio',
      auth: {
        token: session?.customToken
      }
    });
  
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      // Join user's room
      socketInstance.emit('join', session.user.id);
    });
  
    socketInstance.on('new-message', (message: Message) => {
      console.log('Received message:', message);
      // Only add message if it belongs to the current conversation
      if (
        (message.senderId === selectedUserId && message.receiverId === session.user.id) ||
        (message.senderId === session.user.id && message.receiverId === selectedUserId)
      ) {
        setMessages(prev => [...prev, message]);
      }
    });
  
    setSocket(socketInstance);
  
    return () => {
      socketInstance.disconnect();
    };
  }, [session, selectedUserId]);

  // Load conversation history when user is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!session?.user?.id || !selectedUserId) return;

      try {
        const response = await fetch(`/api/getMessages?conversationId=${session.user.id}-${selectedUserId}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      }
    };

    loadConversation();
  }, [selectedUserId, session?.user?.id]);

  // Send message handler
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user?.id || !selectedUserId) return;

    const messageData = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: session.user.id,
      receiverId: selectedUserId,
      conversationId: `${session.user.id}-${selectedUserId}`,
      createdAt: new Date().toISOString()
    };

    // Add message to local state
    setMessages(prev => [...prev, messageData]);
    
    // Emit through socket
    socket?.emit('send-message', messageData);
    
    // Clear input
    setNewMessage('');
  };

  // Filter out current user from users list
  const otherUsers = allUsers.filter(user => user.id !== session?.user?.id);

  return (
    <div className="flex">
      {/* Users list */}
      <div className="w-1/3 bg-gray-50 dark:bg-slate-900 border-r p-2">
        <ScrollArea className="h-full">
          {otherUsers.map((user) => (
            <div 
              key={user.id} 
              className={`px-3 py-2 dark:hover:bg-slate-600 hover:bg-gray-200 cursor-pointer ${
                selectedUserId === user.id ? 'bg-gray-200 dark:bg-slate-600' : ''
              }`}
              onClick={() => setSelectedUserId(user.id)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-600 text-white">
                    {user.name?.[0] || user.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm dark:hover:text-black">
                  {user.name || user.email}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <Card className="w-3/4 h-[600px] flex flex-col">
        <CardContent className="rounded-none flex flex-col h-full p-4">
          <ScrollArea className="flex-grow mb-4 pr-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === session?.user?.id;
                const user = allUsers.find(u => u.id === message.senderId);
                
                return (
                  <div key={message.id} className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`${isCurrentUser ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
                        {user?.name?.[0] || user?.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`p-3 max-w-[70%] ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-md`}>
                      <p className={`text-sm break-words ${isCurrentUser ? 'text-white' : 'dark:text-black'}`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input form */}
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow"
              disabled={!selectedUserId}
            />
            <Button type="submit" disabled={!selectedUserId}>Send</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatComponent;