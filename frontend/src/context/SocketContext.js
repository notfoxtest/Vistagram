import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const socketUrl = BACKEND_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
      
      const newSocket = io(BACKEND_URL, {
        path: '/ws/socket.io',
        transports: ['websocket', 'polling'],
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  const joinChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('join_channel', { channel_id: channelId });
    }
  };

  const leaveChannel = (channelId) => {
    if (socket && connected) {
      socket.emit('leave_channel', { channel_id: channelId });
    }
  };

  const joinDM = (dmId) => {
    if (socket && connected) {
      socket.emit('join_dm', { dm_id: dmId });
    }
  };

  const startTyping = (channelId) => {
    if (socket && connected && user) {
      socket.emit('typing_start', { 
        channel_id: channelId, 
        user: { id: user.id, username: user.username } 
      });
    }
  };

  const stopTyping = (channelId) => {
    if (socket && connected && user) {
      socket.emit('typing_stop', { 
        channel_id: channelId, 
        user: { id: user.id, username: user.username } 
      });
    }
  };

  const joinVoice = (channelId) => {
    if (socket && connected && user) {
      socket.emit('voice_join', {
        channel_id: channelId,
        user: { id: user.id, username: user.username, avatar: user.avatar }
      });
    }
  };

  const leaveVoice = (channelId) => {
    if (socket && connected && user) {
      socket.emit('voice_leave', {
        channel_id: channelId,
        user: { id: user.id, username: user.username }
      });
    }
  };

  const value = {
    socket,
    connected,
    joinChannel,
    leaveChannel,
    joinDM,
    startTyping,
    stopTyping,
    joinVoice,
    leaveVoice
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
