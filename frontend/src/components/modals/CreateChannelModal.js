import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Hash, Volume2, Video, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const CreateChannelModal = ({ open, onClose, serverId }) => {
  const { createChannel } = useApp();
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('text');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!channelName.trim()) {
      toast.error('Please enter a channel name');
      return;
    }
    
    setLoading(true);
    try {
      await createChannel(channelName.trim().toLowerCase().replace(/\s+/g, '-'), channelType, serverId);
      toast.success('Channel created!');
      onClose();
      setChannelName('');
      setChannelType('text');
    } catch (error) {
      toast.error('Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const channelTypes = [
    { value: 'text', label: 'Text Channel', icon: Hash, description: 'Send messages, images, GIFs' },
    { value: 'voice', label: 'Voice Channel', icon: Volume2, description: 'Hang out together with voice' },
    { value: 'video', label: 'Video Channel', icon: Video, description: 'Screen share and video call' },
    { value: 'announcement', label: 'Announcement', icon: Megaphone, description: 'Important announcements' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel-solid border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-outfit text-xl">Create Channel</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Channel Type</Label>
            <div className="space-y-2">
              {channelTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      channelType === type.value 
                        ? 'bg-indigo-500/20 border border-indigo-500/50' 
                        : 'bg-black/30 hover:bg-black/50 border border-transparent'
                    }`}
                    onClick={() => setChannelType(type.value)}
                    data-testid={`channel-type-${type.value}`}
                  >
                    <Icon className="w-5 h-5 text-zinc-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{type.label}</p>
                      <p className="text-xs text-zinc-500">{type.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      channelType === type.value 
                        ? 'border-indigo-500 bg-indigo-500' 
                        : 'border-zinc-600'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Channel Name</Label>
            <div className="relative">
              {channelType === 'text' && <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />}
              {channelType === 'voice' && <Volume2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />}
              {channelType === 'video' && <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />}
              {channelType === 'announcement' && <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />}
              <Input
                placeholder={channelType === 'text' ? 'new-channel' : 'New Channel'}
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600"
                data-testid="create-channel-name-input"
              />
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-400 h-11"
            data-testid="create-channel-submit-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Channel'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;
