import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { 
  Hash, Volume2, Video, ChevronDown, ChevronRight, Plus, Settings, 
  Mic, Headphones, Send, Smile, PlusCircle, Users, Pin, Bell, Search,
  MessageCircle, Crown, Compass
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export default function ChatSection() {
  const { user, axiosInstance } = useAuth();
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [dms, setDms] = useState([]);
  const [currentDM, setCurrentDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [view, setView] = useState('server'); // 'server' | 'dm'
  const [messageInput, setMessageInput] = useState('');
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [serverName, setServerName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('text');
  const [showMembers, setShowMembers] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({ text: true, voice: true });
  const messagesEndRef = useRef(null);

  // Fetch servers
  const fetchServers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    }
  }, [axiosInstance]);

  // Fetch channels
  const fetchChannels = useCallback(async (serverId) => {
    try {
      const response = await axiosInstance.get(`/servers/${serverId}/channels`);
      setChannels(response.data);
      const textChannel = response.data.find(c => c.channel_type === 'text');
      if (textChannel) {
        setCurrentChannel(textChannel);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  }, [axiosInstance]);

  // Fetch messages
  const fetchMessages = useCallback(async (channelId) => {
    try {
      const response = await axiosInstance.get(`/channels/${channelId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [axiosInstance]);

  // Fetch members
  const fetchMembers = useCallback(async (serverId) => {
    try {
      const response = await axiosInstance.get(`/servers/${serverId}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [axiosInstance]);

  // Fetch DMs
  const fetchDMs = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/dms');
      setDms(response.data);
    } catch (error) {
      console.error('Failed to fetch DMs:', error);
    }
  }, [axiosInstance]);

  // Fetch DM messages
  const fetchDMMessages = useCallback(async (dmId) => {
    try {
      const response = await axiosInstance.get(`/dms/${dmId}/messages`);
      setDmMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch DM messages:', error);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchServers();
    fetchDMs();
  }, [fetchServers, fetchDMs]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, dmMessages]);

  const handleCreateServer = async () => {
    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }
    try {
      const response = await axiosInstance.post('/servers', { name: serverName.trim() });
      setServers(prev => [...prev, response.data]);
      setCurrentServer(response.data);
      setServerName('');
      setShowCreateServer(false);
      setView('server');
      toast.success('Server created!');
    } catch (error) {
      toast.error('Failed to create server');
    }
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim() || !currentServer) {
      toast.error('Please enter a channel name');
      return;
    }
    try {
      const response = await axiosInstance.post('/channels', {
        name: channelName.trim(),
        channel_type: channelType,
        server_id: currentServer.id
      });
      setChannels(prev => [...prev, response.data]);
      if (response.data.channel_type === 'text') {
        setCurrentChannel(response.data);
      }
      setChannelName('');
      setShowCreateChannel(false);
      toast.success('Channel created!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create channel');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      if (view === 'dm' && currentDM) {
        const response = await axiosInstance.post('/dms/messages', {
          content: messageInput.trim(),
          dm_id: currentDM.id
        });
        setDmMessages(prev => [...prev, response.data]);
      } else if (currentChannel) {
        const response = await axiosInstance.post('/messages', {
          content: messageInput.trim(),
          channel_id: currentChannel.id
        });
        setMessages(prev => [...prev, response.data]);
      }
      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const textChannels = channels.filter(c => c.channel_type === 'text' || c.channel_type === 'announcement');
  const voiceChannels = channels.filter(c => c.channel_type === 'voice' || c.channel_type === 'video');

  const getOtherUser = (dm) => dm?.participants_info?.find(p => p.id !== user?.id) || {};

  return (
    <div className="h-full flex" data-testid="chat-section">
      {/* Server Sidebar */}
      <div className="w-[72px] bg-[var(--bg-layer1)] border-r border-[var(--glass-border)] flex flex-col items-center py-3 gap-2 overflow-y-auto">
        {/* DM Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setView('dm'); setCurrentServer(null); }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                view === 'dm' ? 'bg-[var(--accent-primary)] rounded-xl' : 'bg-[var(--bg-layer2)] hover:bg-[var(--accent-primary)] hover:rounded-xl'
              }`}
              data-testid="dm-button"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Direct Messages</TooltipContent>
        </Tooltip>

        <div className="w-8 h-0.5 bg-[var(--glass-border)] rounded-full my-1" />

        {/* Server List */}
        {servers.map((server) => (
          <Tooltip key={server.id}>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setCurrentServer(server); setView('server'); setCurrentDM(null); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all ${
                  currentServer?.id === server.id ? 'rounded-xl ring-2 ring-[var(--accent-primary)]' : 'hover:rounded-xl'
                }`}
                data-testid={`server-${server.id}`}
              >
                {server.icon ? (
                  <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--bg-layer2)] flex items-center justify-center text-[var(--text-primary)] font-semibold">
                    {server.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">{server.name}</TooltipContent>
          </Tooltip>
        ))}

        {/* Add Server */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateServer(true)}
              className="w-12 h-12 rounded-2xl bg-[var(--bg-layer2)] flex items-center justify-center text-[var(--accent-success)] hover:bg-[var(--accent-success)] hover:text-white hover:rounded-xl transition-all"
              data-testid="add-server-btn"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Create Server</TooltipContent>
        </Tooltip>

        {/* Discover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDiscover(true)}
              className="w-12 h-12 rounded-2xl bg-[var(--bg-layer2)] flex items-center justify-center text-[var(--accent-success)] hover:bg-[var(--accent-success)] hover:text-white hover:rounded-xl transition-all"
              data-testid="discover-btn"
            >
              <Compass className="w-6 h-6" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right">Discover Servers</TooltipContent>
        </Tooltip>
      </div>

      {/* Channel/DM Sidebar */}
      <div className="w-60 bg-[var(--bg-layer1)]/50 border-r border-[var(--glass-border)] flex flex-col">
        {view === 'dm' ? (
          <>
            <div className="h-12 px-4 flex items-center border-b border-[var(--glass-border)]">
              <h2 className="font-outfit font-semibold text-[var(--text-primary)]">Direct Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {dms.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-8 text-sm">No conversations yet</p>
              ) : (
                dms.map((dm) => {
                  const other = getOtherUser(dm);
                  return (
                    <button
                      key={dm.id}
                      onClick={() => setCurrentDM(dm)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        currentDM?.id === dm.id ? 'bg-[var(--accent-primary)]/20' : 'hover:bg-[var(--glass-panel)]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={other.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.username}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm text-[var(--text-secondary)] truncate">{other.username}</span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : currentServer ? (
          <>
            <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--glass-border)]">
              <h2 className="font-outfit font-semibold text-[var(--text-primary)] truncate">{currentServer.name}</h2>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {/* Text Channels */}
              <div className="mb-2">
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, text: !prev.text }))}
                  className="w-full flex items-center gap-1 px-1 py-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  {expandedCategories.text ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Text Channels
                  {currentServer.owner_id === user?.id && (
                    <Plus 
                      className="w-4 h-4 ml-auto hover:text-[var(--text-primary)]" 
                      onClick={(e) => { e.stopPropagation(); setChannelType('text'); setShowCreateChannel(true); }}
                    />
                  )}
                </button>
                {expandedCategories.text && textChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setCurrentChannel(channel)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      currentChannel?.id === channel.id 
                        ? 'bg-[var(--accent-primary)]/20 text-[var(--text-primary)]' 
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-panel)]'
                    }`}
                    data-testid={`channel-${channel.id}`}
                  >
                    <Hash className="w-4 h-4" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>

              {/* Voice Channels */}
              <div>
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, voice: !prev.voice }))}
                  className="w-full flex items-center gap-1 px-1 py-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide hover:text-[var(--text-secondary)]"
                >
                  {expandedCategories.voice ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Voice Channels
                  {currentServer.owner_id === user?.id && (
                    <Plus 
                      className="w-4 h-4 ml-auto hover:text-[var(--text-primary)]" 
                      onClick={(e) => { e.stopPropagation(); setChannelType('voice'); setShowCreateChannel(true); }}
                    />
                  )}
                </button>
                {expandedCategories.voice && voiceChannels.map((channel) => (
                  <button
                    key={channel.id}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-panel)] transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-center text-[var(--text-muted)] text-sm">Select a server</p>
          </div>
        )}

        {/* User Panel */}
        <div className="p-2 border-t border-[var(--glass-border)] bg-[var(--bg-layer1)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden relative">
              <img src={user?.avatar} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--accent-success)] border-2 border-[var(--bg-layer1)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.username}</p>
              <p className="text-xs text-[var(--text-muted)]">#{user?.discriminator}</p>
            </div>
            <div className="flex gap-1">
              <button className="p-1.5 rounded hover:bg-[var(--glass-panel)] text-[var(--text-muted)]">
                <Mic className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-[var(--glass-panel)] text-[var(--text-muted)]">
                <Headphones className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-base)]">
        {/* Chat Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--bg-layer1)]/30">
          <div className="flex items-center gap-2">
            {view === 'dm' && currentDM ? (
              <>
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img src={getOtherUser(currentDM).avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="font-medium text-[var(--text-primary)]">{getOtherUser(currentDM).username}</span>
              </>
            ) : currentChannel ? (
              <>
                <Hash className="w-5 h-5 text-[var(--text-muted)]" />
                <span className="font-medium text-[var(--text-primary)]">{currentChannel.name}</span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">Select a channel</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded hover:bg-[var(--glass-panel)] text-[var(--text-muted)]">
              <Pin className="w-5 h-5" />
            </button>
            <button className="p-2 rounded hover:bg-[var(--glass-panel)] text-[var(--text-muted)]">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded hover:bg-[var(--glass-panel)] ${showMembers ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" data-testid="messages-container">
          {(view === 'dm' ? dmMessages : messages).length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-layer2)] flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-muted)]">No messages yet</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {(view === 'dm' ? dmMessages : messages).map((message, index) => {
                const msgs = view === 'dm' ? dmMessages : messages;
                const showHeader = index === 0 || msgs[index - 1]?.author_id !== message.author_id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${showHeader ? 'mt-4' : 'mt-0.5'}`}
                  >
                    {showHeader && (
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img src={message.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author?.username}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={showHeader ? '' : 'ml-14'}>
                      {showHeader && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-medium text-[var(--text-primary)]">{message.author?.username}</span>
                          <span className="text-xs text-[var(--text-muted)]">{formatTimestamp(message.created_at)}</span>
                        </div>
                      )}
                      <p className="text-[var(--text-secondary)] break-words">{message.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-[var(--input-bg)] rounded-xl px-4 py-3 border border-[var(--glass-border)]">
            <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <PlusCircle className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={view === 'dm' && currentDM ? `Message @${getOtherUser(currentDM).username}` : currentChannel ? `Message #${currentChannel.name}` : 'Select a channel'}
              disabled={view === 'dm' ? !currentDM : !currentChannel}
              className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              data-testid="message-input"
            />
            <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Smile className="w-6 h-6" />
            </button>
            <button 
              type="submit" 
              disabled={!messageInput.trim()}
              className="p-2 bg-[var(--accent-primary)] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Member List */}
      {showMembers && view === 'server' && currentServer && (
        <div className="w-60 bg-[var(--bg-layer1)]/30 border-l border-[var(--glass-border)] p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
            Members — {members.length}
          </h3>
          {members.map((member) => (
            <button
              key={member.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--glass-panel)] transition-colors"
              data-testid={`member-${member.id}`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--bg-layer1)] ${member.status === 'online' ? 'bg-[var(--accent-success)]' : 'bg-[var(--text-muted)]'}`} />
              </div>
              <span className="text-sm text-[var(--text-secondary)] truncate flex items-center gap-1">
                {member.username}
                {currentServer.owner_id === member.id && <Crown className="w-3 h-3 text-yellow-500" />}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Create Server Modal */}
      <Dialog open={showCreateServer} onOpenChange={setShowCreateServer}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Create a Server</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-2 block">Server Name</label>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="My Awesome Server"
                className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
                data-testid="create-server-name-input"
              />
            </div>
            <Button onClick={handleCreateServer} className="w-full btn-roblox" data-testid="create-server-submit-btn">
              Create Server
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setChannelType('text')}
                className={`flex-1 p-3 rounded-lg border transition-colors ${channelType === 'text' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--glass-border)]'}`}
              >
                <Hash className="w-5 h-5 mx-auto mb-1 text-[var(--text-secondary)]" />
                <p className="text-xs text-[var(--text-secondary)]">Text</p>
              </button>
              <button
                onClick={() => setChannelType('voice')}
                className={`flex-1 p-3 rounded-lg border transition-colors ${channelType === 'voice' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--glass-border)]'}`}
              >
                <Volume2 className="w-5 h-5 mx-auto mb-1 text-[var(--text-secondary)]" />
                <p className="text-xs text-[var(--text-secondary)]">Voice</p>
              </button>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-2 block">Channel Name</label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={channelType === 'text' ? 'general-chat' : 'General Voice'}
                className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
                data-testid="create-channel-name-input"
              />
            </div>
            <Button onClick={handleCreateChannel} className="w-full btn-roblox" data-testid="create-channel-submit-btn">
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discover Modal */}
      <Dialog open={showDiscover} onOpenChange={setShowDiscover}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Discover Servers</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DiscoverServers axiosInstance={axiosInstance} onJoin={(server) => { setServers(prev => [...prev, server]); setShowDiscover(false); }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscoverServers({ axiosInstance, onJoin }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await axiosInstance.get('/discover/servers');
        setServers(response.data);
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, [axiosInstance]);

  const handleJoin = async (server) => {
    try {
      await axiosInstance.post(`/servers/join/${server.invite_code}`);
      toast.success(`Joined ${server.name}!`);
      onJoin(server);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join server');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>;
  }

  if (servers.length === 0) {
    return <div className="text-center py-8 text-[var(--text-muted)]">No public servers found</div>;
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {servers.map((server) => (
        <div key={server.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-layer2)]">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            {server.icon ? (
              <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--bg-layer3)] flex items-center justify-center text-[var(--text-primary)] font-bold">
                {server.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{server.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{server.member_count} members</p>
          </div>
          <Button onClick={() => handleJoin(server)} className="btn-roblox-green text-sm px-4 py-2">
            Join
          </Button>
        </div>
      ))}
    </div>
  );
}
