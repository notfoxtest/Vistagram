import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Plus, Compass, MessageCircle, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import CreateServerModal from './modals/CreateServerModal';
import DiscoverModal from './modals/DiscoverModal';
import SettingsModal from './modals/SettingsModal';

export const ServerSidebar = ({ onDMClick, onServerClick, currentView }) => {
  const { user } = useAuth();
  const { servers, currentServer, setCurrentServer, setCurrentChannel, setCurrentDM } = useApp();
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleServerClick = (server) => {
    setCurrentServer(server);
    setCurrentDM(null);
    setCurrentChannel(null);
    onServerClick();
  };

  const handleDMClick = () => {
    setCurrentServer(null);
    setCurrentChannel(null);
    onDMClick();
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="server-sidebar" data-testid="server-sidebar">
        {/* DM Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`server-icon bg-zinc-800 hover:bg-indigo-500 ${currentView === 'dm' ? 'active bg-indigo-500' : ''}`}
              onClick={handleDMClick}
              data-testid="dm-button"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
            Direct Messages
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-8 h-0.5 bg-white/10 rounded-full my-1" />

        {/* Server List */}
        <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto py-2">
          <AnimatePresence>
            {servers.map((server) => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`server-icon bg-zinc-800 ${currentServer?.id === server.id ? 'active' : ''}`}
                    onClick={() => handleServerClick(server)}
                    data-testid={`server-icon-${server.id}`}
                  >
                    {server.icon ? (
                      <img src={server.icon} alt={server.name} />
                    ) : (
                      <span className="text-lg font-semibold text-white">
                        {server.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
                  {server.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Server */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="server-icon bg-zinc-800 hover:bg-green-500 group"
              onClick={() => setShowCreateServer(true)}
              data-testid="add-server-btn"
            >
              <Plus className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
            Add a Server
          </TooltipContent>
        </Tooltip>

        {/* Discover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="server-icon bg-zinc-800 hover:bg-green-500 group"
              onClick={() => setShowDiscover(true)}
              data-testid="discover-btn"
            >
              <Compass className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
            Explore Servers
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-8 h-0.5 bg-white/10 rounded-full my-1" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="server-icon bg-zinc-800 hover:bg-zinc-700"
              onClick={() => setShowSettings(true)}
              data-testid="settings-btn"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="rounded-full" />
              ) : (
                <Settings className="w-6 h-6 text-zinc-400" />
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
            User Settings
          </TooltipContent>
        </Tooltip>

        {/* Modals */}
        <CreateServerModal open={showCreateServer} onClose={() => setShowCreateServer(false)} />
        <DiscoverModal open={showDiscover} onClose={() => setShowDiscover(false)} />
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </TooltipProvider>
  );
};

export default ServerSidebar;
