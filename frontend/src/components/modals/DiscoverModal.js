import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const DiscoverModal = ({ open, onClose }) => {
  const { discoverServers, joinServer, fetchServers } = useApp();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningServer, setJoiningServer] = useState(null);

  useEffect(() => {
    if (open) {
      loadServers();
    }
  }, [open]);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await discoverServers();
      setServers(data);
    } catch (error) {
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (server) => {
    setJoiningServer(server.id);
    try {
      await joinServer(server.invite_code);
      await fetchServers();
      toast.success(`Joined ${server.name}!`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join server');
    } finally {
      setJoiningServer(null);
    }
  };

  const filteredServers = servers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel-solid border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white font-outfit text-xl">
            Discover Servers
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/50 border-white/10 text-white placeholder:text-zinc-600"
              data-testid="discover-search-input"
            />
          </div>

          {/* Server List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredServers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">No public servers found</p>
                <p className="text-zinc-600 text-sm mt-1">Try creating your own!</p>
              </div>
            ) : (
              filteredServers.map((server) => (
                <div 
                  key={server.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-black/30 hover:bg-black/50 transition-colors"
                  data-testid={`discover-server-${server.id}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {server.icon ? (
                      <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-semibold text-white">
                        {server.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-outfit font-semibold text-white truncate">{server.name}</h3>
                    {server.description && (
                      <p className="text-sm text-zinc-400 truncate">{server.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs text-zinc-500">{server.member_count} members</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(server)}
                    disabled={joiningServer === server.id}
                    className="bg-green-500 hover:bg-green-400 flex-shrink-0"
                    data-testid={`join-discover-server-${server.id}`}
                  >
                    {joiningServer === server.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Join'
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscoverModal;
