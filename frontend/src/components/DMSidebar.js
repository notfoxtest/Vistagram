import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { MessageCircle, Plus, Search, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

export const DMSidebar = () => {
  const { user } = useAuth();
  const { dms, currentDM, setCurrentDM, searchUsers, createDM } = useApp();
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStartDM = async (recipient) => {
    try {
      const dm = await createDM(recipient.id);
      setCurrentDM(dm);
      setShowNewDM(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const getOtherUser = (dm) => {
    return dm.participants_info?.find(p => p.id !== user?.id) || {};
  };

  return (
    <div className="channel-sidebar" data-testid="dm-sidebar">
      {/* Header */}
      <div className="channel-header">
        <h2 className="font-outfit font-semibold text-white">Direct Messages</h2>
        <button 
          className="p-1 hover:bg-white/10 rounded transition-colors"
          onClick={() => setShowNewDM(true)}
          data-testid="new-dm-btn"
        >
          <Plus className="w-5 h-5 text-zinc-400 hover:text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Find or start a conversation"
            className="pl-9 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 h-8 text-sm"
            data-testid="dm-search-input"
          />
        </div>
      </div>

      {/* DM List */}
      <div className="flex-1 overflow-y-auto px-2">
        <AnimatePresence>
          {dms.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500 text-sm">No conversations yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-indigo-400 hover:text-indigo-300"
                onClick={() => setShowNewDM(true)}
              >
                Start a conversation
              </Button>
            </div>
          ) : (
            dms.map((dm) => {
              const otherUser = getOtherUser(dm);
              return (
                <motion.div
                  key={dm.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`channel-item ${currentDM?.id === dm.id ? 'active' : ''}`}
                  onClick={() => setCurrentDM(dm)}
                  data-testid={`dm-${dm.id}`}
                >
                  <div className="member-avatar w-8 h-8 relative">
                    <img 
                      src={otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`} 
                      alt="" 
                      className="rounded-full"
                    />
                    <div className={`member-status status-${otherUser.status || 'offline'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{otherUser.username}</p>
                    {dm.last_message && (
                      <p className="text-xs text-zinc-500 truncate">
                        {dm.last_message.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* New DM Modal */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent className="glass-panel-solid border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-outfit">New Message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 bg-black/50 border-white/10 text-white placeholder:text-zinc-600"
                data-testid="new-dm-search-input"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {searching ? (
                <p className="text-center text-zinc-500 py-4">Searching...</p>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p className="text-center text-zinc-500 py-4">No users found</p>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                    onClick={() => handleStartDM(result)}
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="member-avatar w-10 h-10 relative">
                      <img 
                        src={result.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`} 
                        alt="" 
                        className="rounded-full"
                      />
                      <div className={`member-status status-${result.status || 'offline'}`} />
                    </div>
                    <div>
                      <p className="text-white">{result.username}</p>
                      <p className="text-xs text-zinc-500">#{result.discriminator}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DMSidebar;
