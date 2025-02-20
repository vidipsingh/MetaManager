"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Socket, io } from 'socket.io-client';
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
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [isCallPending, setIsCallPending] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [pendingCallerId, setPendingCallerId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;

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

    const initSocket = async () => {
      if (!session?.user?.id || socketRef.current) return;

      const socketInstance = io('', {
        path: '/api/socketio',
        transports: ['websocket'],
        auth: {
          userId: session.user.id
        }
      });

      socketInstance.on('connect', () => {
        console.log("Socket connected with ID:", socketInstance.id);
        if (mounted) {
          setSocket(socketInstance);
          socketRef.current = socketInstance;
        }
      });

      socketInstance.on('update-users', (onlineUserIds: string[]) => {
        console.log('Received online users:', onlineUserIds);
        if (mounted) {
          setOnlineUsers(onlineUserIds.filter(id => id !== session.user.id));
        }
      });

      socketInstance.on('call-offer', async ({ offer, callerId }) => {
        console.log('Received call offer from:', callerId);
        const caller = users.find(u => u.id === callerId);
        if (caller && mounted) {
          // Store the offer and caller ID for when the user clicks on them
          setPendingOffer(offer);
          setPendingCallerId(callerId);
          setSelectedUser(caller);
        }
      });

      socketInstance.on('call-accepted', async ({ answer }) => {
        console.log('Call accepted, setting remote description');
        if (peerConnection.current && !peerConnection.current.currentRemoteDescription && mounted) {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            setIsCallPending(false);
            setIsCallActive(true);
            setIsCallInProgress(true);
          } catch (error) {
            console.error('Error setting remote description:', error);
            cleanupCall();
          }
        }
      });

      socketInstance.on('ice-candidate', async ({ candidate }) => {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      });

      socketInstance.on('call-ended', () => {
        if (mounted) {
          cleanupCall();
        }
      });
    };

    initSocket();
    fetchUsers();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      cleanupCall();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true; // Mute local video
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = false; // Ensure remote video isn't muted
    }
  }, [remoteStream]);

  const handleUserSelect = async (user: User) => {
    if (pendingCallerId === user.id) {
      // Don't do anything for receiver clicking on caller - call is auto-accepted
      return;
    }

    setSelectedUser(user);
    if (!isCallActive && !pendingOffer) {
      setIsCaller(true);
    }
  };

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [
        { 
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302'
          ]
        },
        {
          urls: ['turn:your-turn-server.com:3478'],
          username: 'your_username',
          credential: 'your_password'
        }
      ],
      iceCandidatePoolSize: 10
    };

    const pc = new RTCPeerConnection(configuration);

  pc.ontrack = (event) => {
    console.log('Received remote track:', event.streams[0]);
    // Set remote stream for each track received
    if (event.streams[0]) {
      event.streams[0].getTracks().forEach(track => {
        if (!remoteStream) {
          setRemoteStream(event.streams[0]);
        } else {
          remoteStream.addTrack(track);
        }
      });
    }
  };

    pc.onicecandidate = (event) => {
      if (event.candidate && selectedUser && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          receiverId: selectedUser.id
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || 
          pc.iceConnectionState === 'failed' || 
          pc.iceConnectionState === 'closed') {
        cleanupCall();
      }
    };

      // Rest of the code remains same
  return pc;
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (videoError) {
      console.warn('Video failed, trying audio only:', videoError);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setIsVideoEnabled(false);
        setLocalStream(audioStream);
        return audioStream;
      } catch (audioError) {
        console.error('Audio also failed:', audioError);
        throw audioError;
      }
    }
  };

  const startCall = async () => {
    if (!selectedUser || !socketRef.current || isCallActive || !onlineUsers.includes(selectedUser.id)) {
      return;
    }
    
    try {
      setIsCallPending(true);
      setIsCaller(true);

      const stream = await initializeMedia();
      
      const pc = createPeerConnection();
      peerConnection.current = pc;

      stream.getTracks().forEach(track => {
        if (pc && stream) {
          console.log('Adding track to peer connection:', track.kind);
          pc.addTrack(track, stream);
        }
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);
      
      console.log('Sending call offer to:', selectedUser.id);
      socketRef.current.emit('call-offer', {
        offer,
        receiverId: selectedUser.id
      });
    } catch (error) {
      console.error('Error starting call:', error);
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsCallInProgress(false);
    setIsCaller(false);
    setSelectedUser(null);
    setIsCallPending(false);
    setPendingOffer(null);
    setPendingCallerId(null);
  };

  const endCall = () => {
    if (selectedUser && socketRef.current) {
      socketRef.current.emit('call-ended', { receiverId: selectedUser.id });
    }
    cleanupCall();
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const renderCenterContent = () => {
    if (isCallActive) {
      return null; // Return null as we'll show the video UI instead
    }

    if (pendingOffer) {
      return (
        <div className="text-center">
          <p className="text-lg mb-4">Incoming call from {selectedUser?.name || selectedUser?.email}</p>
          <p className="text-sm text-gray-600">Click on their name in the sidebar to accept the call</p>
        </div>
      );
    }

    if (selectedUser && isCaller) {
      return (
        <div className="text-center">
          <h3 className="mb-4">Call {selectedUser.name || selectedUser.email}?</h3>
          <button 
            className={`px-4 py-2 rounded-lg ${
              onlineUsers.includes(selectedUser.id) && !isCallPending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={startCall}
            disabled={!onlineUsers.includes(selectedUser.id) || isCallPending}
          >
            {isCallPending ? 'Calling...' : 'Start Call'}
          </button>
        </div>
      );
    }

    return (
      <p>{isCaller ? 'Select an online user to start a call' : 'Waiting for incoming calls...'}</p>
    );
  };

  useEffect(() => {
    socketRef.current?.on('call-offer', async ({ offer, callerId }) => {
      console.log('Received call offer from:', callerId);
      const caller = users.find(u => u.id === callerId);
      if (caller) {
        setPendingOffer(offer);
        setPendingCallerId(callerId);
        setSelectedUser(caller);
        setIsCaller(false);
        // Automatically accept the call
        handleIncomingCall(caller, offer);
      }
    });

    return () => {
      socketRef.current?.off('call-offer');
    };
  }, [users]);

  const handleIncomingCall = async (caller: User, offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await initializeMedia();
      const pc = createPeerConnection();
      peerConnection.current = pc;

      stream.getTracks().forEach(track => {
        if (pc && stream) {
          console.log('Adding track to peer connection:', track.kind);
          pc.addTrack(track, stream);
        }
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('call-accepted', {
        answer,
        receiverId: caller.id
      });

      setIsCallActive(true);
      setIsCallInProgress(true);
      setPendingOffer(null);
      setPendingCallerId(null);
    } catch (error) {
      console.error('Error handling incoming call:', error);
      cleanupCall();
    }
  };


  // const handleUserSelect = (user: User) => {
  //   // Prevent selecting a user if we're handling an incoming call
  //   if (!isCallActive && onlineUsers.includes(user.id) && user.id !== incomingCallerId) {
  //     setSelectedUser(user);
  //   }
  // };


  return (
    <>
    {/* <AlertDialog open={showIncomingCall} onClose={() => setShowIncomingCall(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incoming Call</AlertDialogTitle>
            <AlertDialogDescription>
              {incomingCall?.caller.name || incomingCall?.caller.email} is calling you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={rejectCall}>Decline</AlertDialogCancel>
            <AlertDialogAction onClick={acceptCall}>
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}

<div className="flex h-screen">
        <div className="w-1/4 bg-gray-50 dark:bg-slate-900 border-r">
          <div className="h-full">
            <div className="p-4">
              <h2 className="font-semibold mb-4">Available Users</h2>
              {users.map((user) => {
                const isUserOnline = onlineUsers.includes(user.id);
                const isPendingCall = pendingCallerId === user.id;
                const isCallable = isUserOnline && (!isCallActive || selectedUser?.id === user.id);
                
                return (
                  <div 
                    key={user.id} 
                    className={`p-3 flex items-center gap-2 rounded-lg ${
                      !isCallable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800'
                    } ${
                      selectedUser?.id === user.id ? 'bg-purple-100 dark:bg-purple-900' : ''
                    } ${
                      isPendingCall ? 'animate-pulse bg-green-100 dark:bg-green-900' : ''
                    }`}
                    onClick={() => isCallable ? handleUserSelect(user) : null}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        {user.name?.[0] || user.email?.[0] || '?'}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isUserOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex flex-col">
                      <span>{user.name || user.email}</span>
                      {isPendingCall && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Click to accept call
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="h-full">
            <div className="p-6 flex flex-col h-full">
              {!isCallActive ? (
                <div className="flex-1 flex items-center justify-center">
                  {renderCenterContent()}
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-2 gap-4 relative">
                  <div className="relative">
                    <video
  ref={localVideoRef}
  autoPlay
  playsInline
  muted={true} // Always mute local video
  style={{ transform: 'scaleX(-1)' }} // Mirror local video
  className="w-full h-full object-cover rounded-lg bg-gray-800"
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
  className="w-full h-full object-cover rounded-lg bg-gray-800"
/>
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                      {selectedUser?.name || selectedUser?.email}
                    </p>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                    <button 
                      className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100"
                      onClick={toggleAudio}
                    >
                      {isAudioEnabled ? <Mic /> : <MicOff />}
                    </button>
                    <button
                      className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-100"
                      onClick={toggleVideo}
                    >
                      {isVideoEnabled ? <Video /> : <VideoOff />}
                    </button>
                    <button
                      className="p-3 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      onClick={endCall}
                    >
                      <PhoneOff />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CallComponent;