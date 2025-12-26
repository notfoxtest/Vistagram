import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await signup(username, email, password);
      toast.success('Welcome to Vistagram!');
      navigate('/app');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-base)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-40 right-20 w-80 h-80 bg-[var(--accent-secondary)] rounded-full filter blur-[100px]" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-[var(--accent-primary)] rounded-full filter blur-[120px]" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)] flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white font-outfit">V</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] font-outfit">Join Vistagram</h1>
            <p className="text-[var(--text-secondary)] mt-2">Create your creator account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[var(--text-secondary)]">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[var(--input-bg)] border-[var(--glass-border)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  data-testid="signup-username-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--text-secondary)]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[var(--input-bg)] border-[var(--glass-border)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  data-testid="signup-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--text-secondary)]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[var(--input-bg)] border-[var(--glass-border)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  data-testid="signup-password-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[var(--text-secondary)]">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-[var(--input-bg)] border-[var(--glass-border)] focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  data-testid="signup-confirm-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-roblox-green h-12 text-base mt-6"
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-[var(--accent-primary)] hover:underline font-medium"
                data-testid="login-link"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
