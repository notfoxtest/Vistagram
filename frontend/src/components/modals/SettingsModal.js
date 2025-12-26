import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { User, Palette, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsModal = ({ open, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || 'online');

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ username, bio, status });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    toast.success('Logged out successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-panel-solid border-white/10 max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-outfit text-xl">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid grid-cols-3 bg-black/50">
            <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-500">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-indigo-500">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="nitro" className="data-[state=active]:bg-indigo-500">
              <Sparkles className="w-4 h-4 mr-2" />
              Nitro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/30">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-500/30">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-outfit font-semibold text-white">{user?.username}</h3>
                <p className="text-sm text-zinc-400">#{user?.discriminator}</p>
                <Button size="sm" variant="outline" className="mt-2 border-white/10 text-zinc-300 hover:text-white">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/50 border-white/10 text-white"
                data-testid="settings-username-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[80px]"
                data-testid="settings-bio-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white" data-testid="settings-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10">
                  <SelectItem value="online" className="text-green-400">🟢 Online</SelectItem>
                  <SelectItem value="idle" className="text-yellow-400">🟡 Idle</SelectItem>
                  <SelectItem value="dnd" className="text-red-400">🔴 Do Not Disturb</SelectItem>
                  <SelectItem value="offline" className="text-zinc-400">⚫ Invisible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400"
              data-testid="settings-save-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="text-center py-8 text-zinc-500">
              <Palette className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-lg font-medium text-zinc-400">Appearance Settings</h3>
              <p>Dark mode is the default theme</p>
            </div>
          </TabsContent>

          <TabsContent value="nitro" className="space-y-4 mt-4">
            <div className="relative p-6 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-50" />
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="relative z-10 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-outfit font-bold text-white mb-2">EchoSphere Nitro</h3>
                <p className="text-white/80 mb-4">Unlock animated avatars, custom profiles, and more!</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white font-medium">Animated Avatar</p>
                    <p className="text-sm text-white/60">Use GIFs as your avatar</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white font-medium">Custom Banner</p>
                    <p className="text-sm text-white/60">Stand out with a profile banner</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white font-medium">100MB Uploads</p>
                    <p className="text-sm text-white/60">Share larger files</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white font-medium">Custom Emojis</p>
                    <p className="text-sm text-white/60">Use them everywhere</p>
                  </div>
                </div>

                <Button className="bg-white text-purple-600 hover:bg-white/90 font-medium px-8">
                  Subscribe to Nitro - $9.99/mo
                </Button>
                <p className="text-xs text-white/50 mt-2">(Mock - No actual payment)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
            data-testid="settings-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
