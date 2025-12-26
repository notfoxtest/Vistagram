import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { 
  User, Palette, Crown, Bell, Shield, LogOut, Check, 
  Sun, Moon, Sparkles, Camera, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const themes = [
  { id: 'liquid-glass', name: 'Liquid Glass', description: 'Dark glassmorphism with blur effects', icon: Sparkles, preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' },
  { id: 'dark', name: 'Dark Mode', description: 'Solid dark theme', icon: Moon, preview: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)' },
  { id: 'light', name: 'Light Mode', description: 'Clean light theme', icon: Sun, preview: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' },
];

export default function SettingsSection() {
  const { user, updateProfile, updateTheme, theme, logout, axiosInstance } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ username, bio });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/upload/avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await updateProfile({ avatar: response.data.url });
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'premium', name: 'Premium', icon: Crown },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Safety', icon: Shield },
  ];

  return (
    <div className="h-full flex" data-testid="settings-section">
      {/* Sidebar */}
      <div className="w-64 bg-[var(--bg-layer1)]/50 border-r border-[var(--glass-border)] p-4 hidden md:block">
        <h2 className="text-lg font-outfit font-bold text-[var(--text-primary)] mb-4">Settings</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-panel)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-[var(--glass-border)]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Tab Selector */}
        <div className="md:hidden mb-6">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.name}</option>
            ))}
          </select>
        </div>

        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-6">Profile Settings</h2>
            
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--bg-layer2)]">
                  <img 
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center cursor-pointer hover:bg-[var(--accent-primary)]/80 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{user?.username}</h3>
                <p className="text-sm text-[var(--text-muted)]">#{user?.discriminator}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-[var(--text-secondary)]">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
                  data-testid="settings-username-input"
                />
              </div>

              <div>
                <Label className="text-[var(--text-secondary)]">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-2 bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[100px]"
                  data-testid="settings-bio-input"
                />
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-roblox"
                data-testid="settings-save-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-6">Appearance</h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Theme</h3>
              <div className="grid gap-4">
                {themes.map((t) => {
                  const Icon = t.icon;
                  const isActive = theme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => updateTheme(t.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        isActive 
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                          : 'border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50'
                      }`}
                      data-testid={`theme-${t.id}`}
                    >
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ background: t.preview }}
                      >
                        <Icon className={`w-8 h-8 ${t.id === 'light' ? 'text-gray-800' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-[var(--text-primary)]">{t.name}</h4>
                        <p className="text-sm text-[var(--text-muted)]">{t.description}</p>
                      </div>
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Premium Settings */}
        {activeTab === 'premium' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-6">Vistagram Premium</h2>
            
            <div className="glass-card p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20" />
              <div className="relative z-10">
                <Crown className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                  Get exclusive features, custom badges, and unlimited uploads!
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8 text-left max-w-md mx-auto">
                  <div className="p-3 bg-[var(--bg-layer2)] rounded-lg">
                    <p className="font-medium text-[var(--text-primary)]">Custom Badge</p>
                    <p className="text-sm text-[var(--text-muted)]">Stand out in chat</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-layer2)] rounded-lg">
                    <p className="font-medium text-[var(--text-primary)]">HD Uploads</p>
                    <p className="text-sm text-[var(--text-muted)]">No compression</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-layer2)] rounded-lg">
                    <p className="font-medium text-[var(--text-primary)]">Priority Support</p>
                    <p className="text-sm text-[var(--text-muted)]">24/7 assistance</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-layer2)] rounded-lg">
                    <p className="font-medium text-[var(--text-primary)]">Exclusive Themes</p>
                    <p className="text-sm text-[var(--text-muted)]">Premium styles</p>
                  </div>
                </div>

                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-400 hover:to-orange-400 px-8 py-3 text-lg font-bold">
                  Subscribe - R$499/month
                </Button>
                <p className="text-xs text-[var(--text-muted)] mt-2">(Mock - No actual payment)</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-6">Notifications</h2>
            
            <div className="space-y-4">
              {[
                { id: 'messages', label: 'Direct Messages', description: 'Get notified for new messages' },
                { id: 'mentions', label: 'Mentions', description: 'When someone mentions you' },
                { id: 'likes', label: 'Likes', description: 'When someone likes your content' },
                { id: 'followers', label: 'New Followers', description: 'When someone follows you' },
                { id: 'comments', label: 'Comments', description: 'When someone comments on your reels' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 glass-card">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)]">{item.label}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Privacy */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-2xl font-outfit font-bold text-[var(--text-primary)] mb-6">Privacy & Safety</h2>
            
            <div className="space-y-4">
              {[
                { id: 'private', label: 'Private Account', description: 'Only approved followers can see your content' },
                { id: 'activity', label: 'Activity Status', description: 'Show when you\'re active' },
                { id: 'dms', label: 'Allow DMs from Everyone', description: 'Let anyone send you messages' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 glass-card">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)]">{item.label}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
