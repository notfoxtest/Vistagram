import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Hash, Users, Search, Pin, Bell, Smile, PlusCircle, Send, MoreHorizontal, Edit2, Trash2, Reply } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

export const ChatArea = ({ showMembers, onToggleMembers }) => {
  const { user } = useAuth();
  const { currentServer, currentChannel, messages, typingUsers, sendMessage, addReaction, removeReaction, editMessage, deleteMessage } = useApp();
  const { startTyping, stopTyping } = useSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reactionPickerMessage, setReactionPickerMessage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChannel) return;

    try {
      await sendMessage(messageInput.trim(), currentChannel.id);
      setMessageInput('');
      stopTyping(currentChannel.id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (currentChannel) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Start typing indicator
      startTyping(currentChannel.id);
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentChannel.id);
      }, 2000);
    }
  };

  const handleEmojiSelect = (emojiData) => {
    if (reactionPickerMessage) {
      handleReaction(reactionPickerMessage, emojiData.emoji);
      setReactionPickerMessage(null);
    } else {
      setMessageInput(prev => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (error) {
      toast.error('Failed to remove reaction');
    }
  };

  const handleEditMessage = async () => {
    if (!editContent.trim() || !editingMessage) return;
    
    try {
      await editMessage(editingMessage.id, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
      toast.success('Message edited');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
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

  const channelTypingUsers = currentChannel ? typingUsers[currentChannel.id] || [] : [];

  if (!currentServer) {
    return (
      <div className="chat-area flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <Hash className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-xl font-outfit font-semibold text-zinc-300 mb-2">No Server Selected</h2>
          <p className="text-zinc-500">Select a server from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div className="chat-area flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <Hash className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-xl font-outfit font-semibold text-zinc-300 mb-2">Select a Channel</h2>
          <p className="text-zinc-500">Pick a channel from the sidebar to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="chat-area" data-testid="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <Hash className="w-6 h-6 text-zinc-400" />
            <h3 className="font-outfit font-semibold text-white">{currentChannel.name}</h3>
          </div>
          <div className="flex items-center gap-2">
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
                  <Bell className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Notification Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-400 hover:text-white">
                  <Search className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">Search</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 hover:bg-white/10 rounded transition-colors ${showMembers ? 'text-white' : 'text-zinc-400'}`}
                  onClick={onToggleMembers}
                  data-testid="toggle-members-btn"
                >
                  <Users className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-white/10 text-white">
                {showMembers ? 'Hide Members' : 'Show Members'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container" data-testid="messages-container">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const showHeader = index === 0 || 
                messages[index - 1].author_id !== message.author_id ||
                new Date(message.created_at) - new Date(messages[index - 1].created_at) > 300000;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`message-group ${showHeader ? 'mt-4' : ''}`}
                  data-testid={`message-${message.id}`}
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
                        <span className="message-author">
                          {message.author?.username}
                          {message.author?.is_nitro && (
                            <span className="nitro-badge ml-2">NITRO</span>
                          )}
                        </span>
                        <span className="message-timestamp">{formatTimestamp(message.created_at)}</span>
                      </div>
                    )}
                    
                    {editingMessage?.id === message.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 bg-black/50 border-white/10 text-white"
                          onKeyDown={(e) => e.key === 'Enter' && handleEditMessage()}
                          autoFocus
                          data-testid="edit-message-input"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleEditMessage}
                          className="bg-indigo-500 hover:bg-indigo-400"
                          data-testid="save-edit-btn"
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingMessage(null)}
                          data-testid="cancel-edit-btn"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <p className="message-text">
                        {message.content}
                        {message.edited_at && (
                          <span className="text-xs text-zinc-500 ml-2">(edited)</span>
                        )}
                      </p>
                    )}

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="message-reactions">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            className={`reaction ${users.includes(user?.id) ? 'active' : ''}`}
                            onClick={() => users.includes(user?.id) 
                              ? handleRemoveReaction(message.id, emoji) 
                              : handleReaction(message.id, emoji)
                            }
                          >
                            <span>{emoji}</span>
                            <span className="reaction-count">{users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute right-4 top-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                          onClick={() => {
                            setReactionPickerMessage(message.id);
                            setShowEmojiPicker(true);
                          }}
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-white/10 text-white">Add Reaction</TooltipContent>
                    </Tooltip>
                    
                    {message.author_id === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black/95 border-white/10">
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingMessage(message);
                              setEditContent(message.content);
                            }}
                            className="text-zinc-300 hover:text-white focus:text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Message
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-400 hover:text-red-300 focus:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {channelTypingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <span>
              {channelTypingUsers.map(u => u.username).join(', ')} {channelTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
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
              placeholder={`Message #${currentChannel.name}`}
              value={messageInput}
              onChange={handleInputChange}
              data-testid="message-input"
            />
            <div className="relative">
              <button 
                type="button" 
                className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                data-testid="emoji-picker-btn"
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
              data-testid="send-message-btn"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChatArea;
