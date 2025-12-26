import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { 
  MessageCircle, Film, MessageSquare, ShoppingBag, Gamepad2, 
  User, Settings, LogOut, Menu, X, Bell, Search, Plus,
  Home, Compass, Users, Crown
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

// Import sections
import ChatSection from '../sections/ChatSection';
import ReelsSection from '../sections/ReelsSection';
import ForumSection from '../sections/ForumSection';
import MarketplaceSection from '../sections/MarketplaceSection';
import StudioSection from '../sections/StudioSection';
import ProfileSection from '../sections/ProfileSection';
import SettingsSection from '../sections/SettingsSection';

const navItems = [
  { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/app/chat' },
  { id: 'reels', icon: Film, label: 'Reels', path: '/app/reels' },
  { id: 'forum', icon: MessageSquare, label: 'Forum', path: '/app/forum' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Sales', path: '/app/marketplace' },
  { id: 'studio', icon: Gamepad2, label: 'Studio', path: '/app/studio' },
];

export default function MainApp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');

  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'chat';
    setActiveSection(path);
  }, [location]);

  const handleNavClick = (item) => {
    navigate(item.path);
    setMobileMenuOpen(false);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-screen w-screen flex bg-[var(--bg-base)] overflow-hidden" data-testid="main-app">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[72px] bg-[var(--sidebar-bg)] border-r border-[var(--glass-border)]">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-[var(--glass-border)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg font-outfit">V</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-4 flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNavClick(item)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30' 
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-panel)]'
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[var(--bg-layer2)] border-[var(--glass-border)] text-[var(--text-primary)]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="py-4 flex flex-col items-center gap-2 border-t border-[var(--glass-border)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/app/profile')}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                    activeSection === 'profile' 
                      ? 'ring-2 ring-[var(--accent-primary)]' 
                      : 'hover:ring-2 hover:ring-[var(--glass-border)]'
                  }`}
                  data-testid="nav-profile"
                >
                  <img 
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                    alt={user?.username}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[var(--bg-layer2)] border-[var(--glass-border)] text-[var(--text-primary)]">
                Profile
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/app/settings')}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-panel)] transition-all ${
                    activeSection === 'settings' ? 'bg-[var(--glass-panel)] text-[var(--text-primary)]' : ''
                  }`}
                  data-testid="nav-settings"
                >
                  <Settings className="w-6 h-6" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[var(--bg-layer2)] border-[var(--glass-border)] text-[var(--text-primary)]">
                Settings
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-all"
                  data-testid="nav-logout"
                >
                  <LogOut className="w-6 h-6" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[var(--bg-layer2)] border-[var(--glass-border)] text-[var(--text-primary)]">
                Logout
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--sidebar-bg)] border-b border-[var(--glass-border)] flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm font-outfit">V</span>
            </div>
            <span className="font-outfit font-bold text-[var(--text-primary)]">Vistagram</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-[var(--glass-panel)]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[var(--text-primary)]" /> : <Menu className="w-6 h-6 text-[var(--text-primary)]" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="md:hidden fixed inset-0 top-16 bg-[var(--bg-base)] z-40 p-4"
            >
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--text-secondary)] hover:bg-[var(--glass-panel)]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
                <div className="border-t border-[var(--glass-border)] my-4" />
                <button
                  onClick={() => { navigate('/app/profile'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-panel)]"
                >
                  <User className="w-6 h-6" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => { navigate('/app/settings'); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-panel)]"
                >
                  <Settings className="w-6 h-6" />
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--sidebar-bg)] border-t border-[var(--glass-border)] flex items-center justify-around z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center gap-1 p-2 ${
                  isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden md:mt-0 mt-16 mb-16 md:mb-0">
          <Routes>
            <Route path="/" element={<ChatSection />} />
            <Route path="/chat/*" element={<ChatSection />} />
            <Route path="/reels" element={<ReelsSection />} />
            <Route path="/forum/*" element={<ForumSection />} />
            <Route path="/marketplace/*" element={<MarketplaceSection />} />
            <Route path="/studio/*" element={<StudioSection />} />
            <Route path="/profile/:userId?" element={<ProfileSection />} />
            <Route path="/settings" element={<SettingsSection />} />
          </Routes>
        </main>
      </div>
    </TooltipProvider>
  );
}
