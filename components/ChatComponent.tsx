"use client"

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

interface ChatComponentProps {
  initialSelectedUserId?: string;
}

const ChatComponent: FC<ChatComponentProps> = ({ initialSelectedUserId }) => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialSelectedUserId || '');
  const [conversationId, setConversationId] = useState<string>('');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      socketInstance.emit('join', session.user.id);
    });

    socketInstance.on('new-message', (message: Message) => {
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        if (message.conversationId === conversationId) {
          return [...prev, message];
        }
        return prev;
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session, conversationId]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!session?.user?.id || !selectedUserId) return;

      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            receiverId: selectedUserId,
          }),
        });

        if (response.ok) {
          const conversation = await response.json();
          setConversationId(conversation.id);
          setMessages(conversation.messages || []);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      }
    };

    loadConversation();
  }, [selectedUserId, session?.user?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user?.id || !selectedUserId || !conversationId) return;

    const messageData = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: session.user.id,
      receiverId: selectedUserId,
      conversationId: conversationId,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        socket?.emit('send-message', messageData);
        setNewMessage('');
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const otherUsers = allUsers.filter(user => user.id !== session?.user?.id);

  return (
    <div className="flex h-screen border-l-[1.5px] border-gray-300 dark:border-gray-500">
      <div className="w-1/3 bg-gray-50 dark:bg-slate-900 border-r">
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
                <span className="font-semibold text-sm">
                  {user.name || user.email}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4 h-full">
          <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
          <div className="space-y-4 min-h-full">
              {messages.map((message) => {
                const isCurrentUser = message.senderId === session?.user?.id;
                const user = allUsers.find(u => u.id === message.senderId);
                
                return (
                  <div key={message.id} className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-purple-600 text-white">
                          {user?.name?.[0] || user?.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`p-3 rounded-lg max-w-[70%] ${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className="text-sm break-words">
                        {message.content}
                      </p>
                    </div>
                    {isCurrentUser && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user?.name?.[0] || user?.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={sendMessage} className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow"
              disabled={!selectedUserId}
            />
            <Button type="submit" disabled={!selectedUserId}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatComponent;