import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { axiosInstance, isAuthenticated } = useAuth();
  
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [dms, setDms] = useState([]);
  const [currentDM, setCurrentDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [voiceUsers, setVoiceUsers] = useState({});

  // Fetch user's servers
  const fetchServers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axiosInstance.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    }
  }, [axiosInstance, isAuthenticated]);

  // Fetch channels for current server
  const fetchChannels = useCallback(async (serverId) => {
    if (!serverId) return;
    try {
      const response = await axiosInstance.get(`/servers/${serverId}/channels`);
      setChannels(response.data);
      // Auto-select first text channel
      const textChannel = response.data.find(c => c.channel_type === 'text');
      if (textChannel && !currentChannel) {
        setCurrentChannel(textChannel);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  }, [axiosInstance, currentChannel]);

  // Fetch messages for current channel
  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    try {
      const response = await axiosInstance.get(`/channels/${channelId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [axiosInstance]);

  // Fetch members for current server
  const fetchMembers = useCallback(async (serverId) => {
    if (!serverId) return;
    try {
      const response = await axiosInstance.get(`/servers/${serverId}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [axiosInstance]);

  // Fetch DMs
  const fetchDMs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axiosInstance.get('/dms');
      setDms(response.data);
    } catch (error) {
      console.error('Failed to fetch DMs:', error);
    }
  }, [axiosInstance, isAuthenticated]);

  // Fetch DM messages
  const fetchDMMessages = useCallback(async (dmId) => {
    if (!dmId) return;
    try {
      const response = await axiosInstance.get(`/dms/${dmId}/messages`);
      setDmMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch DM messages:', error);
    }
  }, [axiosInstance]);

  // Create server
  const createServer = async (name, icon, description) => {
    try {
      const response = await axiosInstance.post('/servers', { name, icon, description });
      setServers(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create server:', error);
      throw error;
    }
  };

  // Join server
  const joinServer = async (inviteCode) => {
    try {
      const response = await axiosInstance.post(`/servers/join/${inviteCode}`);
      await fetchServers();
      return response.data;
    } catch (error) {
      console.error('Failed to join server:', error);
      throw error;
    }
  };

  // Create channel
  const createChannel = async (name, channelType, serverId, categoryId) => {
    try {
      const response = await axiosInstance.post('/channels', {
        name,
        channel_type: channelType,
        server_id: serverId,
        category_id: categoryId
      });
      setChannels(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (content, channelId, attachments = []) => {
    try {
      const response = await axiosInstance.post('/messages', {
        content,
        channel_id: channelId,
        attachments
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Add message to state (for real-time updates)
  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  // Send DM message
  const sendDMMessage = async (content, dmId, attachments = []) => {
    try {
      const response = await axiosInstance.post('/dms/messages', {
        content,
        dm_id: dmId,
        attachments
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send DM:', error);
      throw error;
    }
  };

  // Add DM message to state
  const addDMMessage = (message) => {
    setDmMessages(prev => [...prev, message]);
  };

  // Create DM
  const createDM = async (recipientId) => {
    try {
      const response = await axiosInstance.post('/dms', { recipient_id: recipientId });
      await fetchDMs();
      return response.data;
    } catch (error) {
      console.error('Failed to create DM:', error);
      throw error;
    }
  };

  // Add reaction
  const addReaction = async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // Remove reaction
  const removeReaction = async (messageId, emoji) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  // Edit message
  const editMessage = async (messageId, content) => {
    try {
      const response = await axiosInstance.put(`/messages/${messageId}`, { content });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...response.data } : m));
      return response.data;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  // Search messages
  const searchMessages = async (query, serverId) => {
    try {
      const response = await axiosInstance.get('/search/messages', {
        params: { q: query, server_id: serverId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  };

  // Search users
  const searchUsers = async (query) => {
    try {
      const response = await axiosInstance.get('/search/users', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  // Discover servers
  const discoverServers = async () => {
    try {
      const response = await axiosInstance.get('/discover/servers');
      return response.data;
    } catch (error) {
      console.error('Failed to discover servers:', error);
      return [];
    }
  };

  // Update typing users
  const setUserTyping = (channelId, user, isTyping) => {
    setTypingUsers(prev => {
      const channelTyping = prev[channelId] || [];
      if (isTyping) {
        if (!channelTyping.find(u => u.id === user.id)) {
          return { ...prev, [channelId]: [...channelTyping, user] };
        }
      } else {
        return { ...prev, [channelId]: channelTyping.filter(u => u.id !== user.id) };
      }
      return prev;
    });
  };

  // Update voice users
  const setVoiceUser = (channelId, user, isJoined) => {
    setVoiceUsers(prev => {
      const channelVoice = prev[channelId] || [];
      if (isJoined) {
        if (!channelVoice.find(u => u.id === user.id)) {
          return { ...prev, [channelId]: [...channelVoice, user] };
        }
      } else {
        return { ...prev, [channelId]: channelVoice.filter(u => u.id !== user.id) };
      }
      return prev;
    });
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchServers();
      fetchDMs();
    }
  }, [isAuthenticated, fetchServers, fetchDMs]);

  useEffect(() => {
    if (currentServer) {
      fetchChannels(currentServer.id);
      fetchMembers(currentServer.id);
    }
  }, [currentServer, fetchChannels, fetchMembers]);

  useEffect(() => {
    if (currentChannel) {
      fetchMessages(currentChannel.id);
    }
  }, [currentChannel, fetchMessages]);

  useEffect(() => {
    if (currentDM) {
      fetchDMMessages(currentDM.id);
    }
  }, [currentDM, fetchDMMessages]);

  const value = {
    servers,
    currentServer,
    setCurrentServer,
    channels,
    currentChannel,
    setCurrentChannel,
    messages,
    setMessages,
    members,
    dms,
    currentDM,
    setCurrentDM,
    dmMessages,
    setDmMessages,
    typingUsers,
    voiceUsers,
    fetchServers,
    fetchChannels,
    fetchMessages,
    fetchMembers,
    fetchDMs,
    fetchDMMessages,
    createServer,
    joinServer,
    createChannel,
    sendMessage,
    addMessage,
    sendDMMessage,
    addDMMessage,
    createDM,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    searchMessages,
    searchUsers,
    discoverServers,
    setUserTyping,
    setVoiceUser
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
