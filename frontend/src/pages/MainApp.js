import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import ServerSidebar from '../components/ServerSidebar';
import ChannelSidebar from '../components/ChannelSidebar';
import ChatArea from '../components/ChatArea';
import MemberList from '../components/MemberList';
import DMSidebar from '../components/DMSidebar';
import DMChatArea from '../components/DMChatArea';
import { Loader2 } from 'lucide-react';

export default function MainApp() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { currentServer, currentDM, setUserTyping, setVoiceUser, addMessage, addDMMessage } = useApp();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [showMembers, setShowMembers] = useState(true);
  const [view, setView] = useState('server'); // 'server' | 'dm'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      addMessage(message);
    });

    socket.on('new_dm_message', (message) => {
      addDMMessage(message);
    });

    socket.on('user_typing', ({ user, channel_id }) => {
      setUserTyping(channel_id, user, true);
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setUserTyping(channel_id, user, false);
      }, 3000);
    });

    socket.on('user_stopped_typing', ({ user, channel_id }) => {
      setUserTyping(channel_id, user, false);
    });

    socket.on('voice_user_joined', ({ user, channel_id }) => {
      setVoiceUser(channel_id, user, true);
    });

    socket.on('voice_user_left', ({ user, channel_id }) => {
      setVoiceUser(channel_id, user, false);
    });

    return () => {
      socket.off('new_message');
      socket.off('new_dm_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('voice_user_joined');
      socket.off('voice_user_left');
    };
  }, [socket, addMessage, addDMMessage, setUserTyping, setVoiceUser]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-400">Loading EchoSphere...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`app-container ${!showMembers ? 'hide-members' : ''}`} data-testid="main-app">
      {/* Server Sidebar - Always visible */}
      <ServerSidebar 
        onDMClick={() => setView('dm')} 
        onServerClick={() => setView('server')}
        currentView={view}
      />

      {/* Channel/DM Sidebar */}
      {view === 'dm' ? (
        <DMSidebar />
      ) : (
        <ChannelSidebar />
      )}

      {/* Main Chat Area */}
      {view === 'dm' ? (
        <DMChatArea />
      ) : (
        <ChatArea 
          showMembers={showMembers} 
          onToggleMembers={() => setShowMembers(!showMembers)} 
        />
      )}

      {/* Member List - Only for server view */}
      {view === 'server' && showMembers && currentServer && (
        <MemberList />
      )}
    </div>
  );
}
