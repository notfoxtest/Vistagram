import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CreateServerModal = ({ open, onClose }) => {
  const { createServer, joinServer, setCurrentServer } = useApp();
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!serverName.trim()) {
      toast.error('Please enter a server name');
      return;
    }
    
    setLoading(true);
    try {
      const server = await createServer(serverName.trim(), null, serverDescription.trim());
      setCurrentServer(server);
      resetForm();
      onClose();
      toast.success('Server created successfully!');
    } catch (error) {
      toast.error('Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }
    
    setLoading(true);
    try {
      await joinServer(inviteCode.trim());
      resetForm();
      onClose();
      toast.success('Joined server successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join server');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServerName('');
    setServerDescription('');
    setInviteCode('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel-solid border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-outfit text-xl text-center">
            Create or Join a Server
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid grid-cols-2 bg-black/50">
            <TabsTrigger value="create" className="data-[state=active]:bg-indigo-500">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="join" className="data-[state=active]:bg-indigo-500">
              <Link2 className="w-4 h-4 mr-2" />
              Join
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Server Name</Label>
              <Input
                placeholder="My Awesome Server"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600"
                data-testid="create-server-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description (optional)</Label>
              <Textarea
                placeholder="What's your server about?"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[80px]"
                data-testid="create-server-description-input"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 h-11"
              data-testid="create-server-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Server'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4 mt-4">
            <div className="text-center text-zinc-400 mb-4">
              <p>Enter an invite code to join an existing server</p>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Invite Code</Label>
              <Input
                placeholder="abc123xy"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600"
                data-testid="join-server-code-input"
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 h-11"
              data-testid="join-server-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Join Server'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServerModal;
