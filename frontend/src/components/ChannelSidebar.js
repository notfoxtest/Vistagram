import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Hash, Volume2, Video, Megaphone, ChevronDown, ChevronRight, Plus, Settings, Mic, Headphones, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import CreateChannelModal from './modals/CreateChannelModal';
import { toast } from 'sonner';

export const ChannelSidebar = () => {
  const { user, logout } = useAuth();
  const { currentServer, channels, currentChannel, setCurrentChannel, voiceUsers } = useApp();
  const { joinChannel, leaveChannel, joinVoice, leaveVoice } = useSocket();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleChannelClick = (channel) => {
    if (channel.channel_type === 'voice' || channel.channel_type === 'video') {
      if (voiceConnected === channel.id) {
        // Disconnect from voice
        leaveVoice(channel.id);
        setVoiceConnected(null);
        toast.info('Disconnected from voice channel');
      } else {
        // Connect to voice
        if (voiceConnected) {
          leaveVoice(voiceConnected);
        }
        joinVoice(channel.id);
        setVoiceConnected(channel.id);
        toast.success(`Connected to ${channel.name}`);
      }
    } else {
      // Leave previous channel room
      if (currentChannel) {
        leaveChannel(currentChannel.id);
      }
      // Join new channel room
      joinChannel(channel.id);
      setCurrentChannel(channel);
    }
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'voice': return <Volume2 className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      default: return <Hash className="w-5 h-5" />;
    }
  };

  // Group channels by category
  const textChannels = channels.filter(c => c.channel_type === 'text' || c.channel_type === 'announcement');
  const voiceChannels = channels.filter(c => c.channel_type === 'voice' || c.channel_type === 'video');

  if (!currentServer) {
    return (
      <div className="channel-sidebar flex items-center justify-center">
        <p className="text-zinc-500 text-center px-4">Select a server to view channels</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="channel-sidebar" data-testid="channel-sidebar">
        {/* Server Header */}
        <div className="channel-header">
          <h2 className="font-outfit font-semibold text-white truncate">{currentServer.name}</h2>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Channel List */}
        <div className="channel-list">
          {/* Text Channels */}
          <div className="channel-category">
            <div 
              className="category-header"
              onClick={() => toggleCategory('text')}
            >
              {expandedCategories['text'] === false ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <span>Text Channels</span>
              {currentServer.owner_id === user?.id && (
                <button 
                  className="ml-auto p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); setShowCreateChannel(true); }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <AnimatePresence>
              {expandedCategories['text'] !== false && textChannels.map((channel) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                  onClick={() => handleChannelClick(channel)}
                  data-testid={`channel-${channel.id}`}
                >
                  {getChannelIcon(channel.channel_type)}
                  <span className="truncate">{channel.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Voice Channels */}
          <div className="channel-category">
            <div 
              className="category-header"
              onClick={() => toggleCategory('voice')}
            >
              {expandedCategories['voice'] === false ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <span>Voice Channels</span>
            </div>
            <AnimatePresence>
              {expandedCategories['voice'] !== false && voiceChannels.map((channel) => (
                <motion.div key={channel.id}>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`channel-item ${voiceConnected === channel.id ? 'active' : ''}`}
                    onClick={() => handleChannelClick(channel)}
                    data-testid={`voice-channel-${channel.id}`}
                  >
                    {getChannelIcon(channel.channel_type)}
                    <span className="truncate">{channel.name}</span>
                  </motion.div>
                  
                  {/* Voice Users */}
                  {voiceUsers[channel.id]?.length > 0 && (
                    <div className="voice-users">
                      {voiceUsers[channel.id].map((voiceUser) => (
                        <div key={voiceUser.id} className="voice-user">
                          <div className="voice-user-avatar">
                            <img src={voiceUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${voiceUser.username}`} alt="" />
                          </div>
                          <span>{voiceUser.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* User Panel */}
        <div className="user-panel">
          <div className="user-panel-avatar relative">
            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="" />
            <div className={`member-status status-${user?.status || 'online'}`} />
          </div>
          <div className="user-panel-info">
            <div className="user-panel-name">{user?.username}</div>
            <div className="user-panel-status">#{user?.discriminator}</div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 rounded hover:bg-white/10 ${isMuted ? 'text-red-500' : 'text-zinc-400'}`}
                  onClick={() => setIsMuted(!isMuted)}
                  data-testid="mute-btn"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">
                {isMuted ? 'Unmute' : 'Mute'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 rounded hover:bg-white/10 ${isDeafened ? 'text-red-500' : 'text-zinc-400'}`}
                  onClick={() => setIsDeafened(!isDeafened)}
                  data-testid="deafen-btn"
                >
                  <Headphones className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">
                {isDeafened ? 'Undeafen' : 'Deafen'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-2 rounded hover:bg-white/10 text-zinc-400"
                  onClick={logout}
                  data-testid="logout-btn"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">
                Logout
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <CreateChannelModal 
          open={showCreateChannel} 
          onClose={() => setShowCreateChannel(false)}
          serverId={currentServer.id}
        />
      </div>
    </TooltipProvider>
  );
};

export default ChannelSidebar;
