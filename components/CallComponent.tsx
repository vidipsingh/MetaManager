import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Socket, io } from 'socket.io-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
}

const CallComponent = () => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    fetchUsers();
    initializeSocket();
  }, [session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/getAllUsers");
      if (res.ok) {
        const allUsers = await res.json();
        setUsers(allUsers.filter((user: User) => user.id !== session?.user?.id));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const initializeSocket = () => {
    if (!session?.user?.id) return;

    const socketInstance = io('http://localhost:3000', {
      path: '/api/socketio',
      auth: { token: session?.customToken }
    });

    socketInstance.on('call-offer', async ({ offer, callerId }) => {
      if (!session?.user?.id) return;
      const caller = users.find(u => u.id === callerId);
      setSelectedUser(caller || null);
      setIsCallActive(true);
      setIsCaller(false);
      await handleOffer(offer);
    });

    socketInstance.on('call-answer', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(answer);
      }
    });

    socketInstance.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(candidate);
      }
    });

    socketInstance.on('call-ended', () => {
      endCall();
    });

    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  };

  const initializePeerConnection = async () => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice-candidate', {
          candidate: event.candidate,
          receiverId: selectedUser?.id
        });
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach(track => {
      if (peerConnection.current) {
        peerConnection.current.addTrack(track, stream);
      }
    });
  };

  const startCall = async () => {
    if (!selectedUser || !socket) return;
    
    setIsCallActive(true);
    setIsCaller(true);
    await initializePeerConnection();

    if (peerConnection.current) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit('call-offer', {
        offer,
        receiverId: selectedUser.id
      });
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    await initializePeerConnection();
    
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket?.emit('call-answer', {
        answer,
        receiverId: selectedUser?.id
      });
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setSelectedUser(null);
    socket?.emit('end-call', { receiverId: selectedUser?.id });
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-50 dark:bg-slate-900 border-r">
        <ScrollArea className="h-full">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Available Users</h2>
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3 flex items-center gap-2 cursor-pointer rounded-lg ${
                  selectedUser?.id === user.id ? 'bg-purple-100 dark:bg-purple-900' : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <Avatar>
                  <AvatarFallback>
                    {user.name?.[0] || user.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <span>{user.name || user.email}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="p-6 flex flex-col h-full">
            {!isCallActive ? (
              <div className="flex-1 flex items-center justify-center">
                {selectedUser ? (
                  <div className="text-center">
                    <h3 className="mb-4">Call {selectedUser.name || selectedUser.email}?</h3>
                    <Button onClick={startCall}>Start Call</Button>
                  </div>
                ) : (
                  <p>Select a user to start a call</p>
                )}
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                    You
                  </p>
                </div>
                <div className="relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                    {selectedUser?.name || selectedUser?.email}
                  </p>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic /> : <MicOff />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video /> : <VideoOff />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={endCall}
                  >
                    <PhoneOff />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallComponent;