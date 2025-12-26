import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Phone, Video, Pin, MoreHorizontal, Smile, PlusCircle, Send, MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

export const DMChatArea = () => {
  const { user } = useAuth();
  const { currentDM, dmMessages, sendDMMessage } = useApp();
  const { joinDM } = useSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const otherUser = currentDM?.participants_info?.find(p => p.id !== user?.id) || {};

  useEffect(() => {
    if (currentDM) {
      joinDM(currentDM.id);
    }
  }, [currentDM, joinDM]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentDM) return;

    try {
      await sendDMMessage(messageInput.trim(), currentDM.id);
      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleEmojiSelect = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
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

  if (!currentDM) {
    return (
      <div className="chat-area flex items-center justify-center" data-testid="dm-chat-area-empty">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-xl font-outfit font-semibold text-zinc-300 mb-2">Your Messages</h2>
          <p className="text-zinc-500">Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="chat-area" data-testid="dm-chat-area">
        {/* DM Header */}
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <div className="member-avatar w-8 h-8 relative">
              <img 
                src={otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} 
                alt="" 
                className="rounded-full"
              />
              <div className={`member-status status-${otherUser.status || 'offline'}`} />
            </div>
            <h3 className="font-outfit font-semibold text-white">{otherUser.username}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white">
                  <Phone className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Start Voice Call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white">
                  <Video className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Start Video Call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white">
                  <Pin className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Pinned Messages</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">More</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Welcome Message */}
        {dmMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src={otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-outfit font-semibold text-white mb-2">{otherUser.username}</h2>
              <p className="text-zinc-500">This is the beginning of your direct message history with {otherUser.username}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {dmMessages.length > 0 && (
          <div className="messages-container" data-testid="dm-messages-container">
            <AnimatePresence initial={false}>
              {dmMessages.map((message, index) => {
                const showHeader = index === 0 || 
                  dmMessages[index - 1].author_id !== message.author_id ||
                  new Date(message.created_at) - new Date(dmMessages[index - 1].created_at) > 300000;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`message-group ${showHeader ? 'mt-4' : ''}`}
                    data-testid={`dm-message-${message.id}`}
                  >
                    {showHeader && (
                      <div className="message-avatar">
                        <img 
                          src={message.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.author?.username}`} 
                          alt="" 
                        />
                      </div>
                    )}
                    
                    <div className={`message-content ${!showHeader ? 'ml-14' : ''}`}>
                      {showHeader && (
                        <div className="message-header">
                          <span className="message-author">{message.author?.username}</span>
                          <span className="message-timestamp">{formatTimestamp(message.created_at)}</span>
                        </div>
                      )}
                      <p className="message-text">{message.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input */}
        <div className="message-input-container">
          <form onSubmit={handleSendMessage} className="message-input-wrapper">
            <button type="button" className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
              <PlusCircle className="w-6 h-6" />
            </button>
            <input
              type="text"
              placeholder={`Message @${otherUser.username}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              data-testid="dm-message-input"
            />
            <div className="relative">
              <button 
                type="button" 
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                data-testid="dm-emoji-picker-btn"
              >
                <Smile className="w-6 h-6" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    theme="dark"
                    searchDisabled
                    skinTonesDisabled
                    width={300}
                    height={350}
                  />
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={!messageInput.trim()}
              className="p-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              data-testid="dm-send-message-btn"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DMChatArea;
