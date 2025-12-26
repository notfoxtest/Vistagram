import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { 
  User, Settings, Film, MessageSquare, ShoppingBag, Users, 
  Calendar, MapPin, Link as LinkIcon, Edit, Grid, List, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export default function ProfileSection() {
  const { userId } = useParams();
  const { user: currentUser, axiosInstance } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = targetUserId === currentUser?.id;

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/users/${targetUserId}`);
      setProfile(response.data);
      setIsFollowing(response.data.followers?.includes(currentUser?.id));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (!isOwnProfile) {
        toast.error('User not found');
        navigate('/app/chat');
      }
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, targetUserId, currentUser?.id, isOwnProfile, navigate]);

  const fetchUserContent = useCallback(async () => {
    try {
      const [reelsResponse] = await Promise.all([
        axiosInstance.get('/reels'),
      ]);
      setReels(reelsResponse.data.filter(r => r.author_id === targetUserId));
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  }, [axiosInstance, targetUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchUserContent();
    }
  }, [targetUserId, fetchProfile, fetchUserContent]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axiosInstance.delete(`/users/${targetUserId}/follow`);
        setIsFollowing(false);
        setProfile(prev => ({
          ...prev,
          followers_count: prev.followers_count - 1
        }));
        toast.success('Unfollowed');
      } else {
        await axiosInstance.post(`/users/${targetUserId}/follow`);
        setIsFollowing(true);
        setProfile(prev => ({
          ...prev,
          followers_count: prev.followers_count + 1
        }));
        toast.success('Following!');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  const displayProfile = profile || currentUser;

  return (
    <div className="h-full overflow-y-auto" data-testid="profile-section">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]">
        {displayProfile?.banner && (
          <img src={displayProfile.banner} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-4 md:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[var(--bg-base)] overflow-hidden bg-[var(--bg-layer2)]">
              <img 
                src={displayProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayProfile?.username}`} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            {displayProfile?.is_premium && (
              <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-xs font-bold text-white">
                PREMIUM
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-outfit font-bold text-[var(--text-primary)]">
                  {displayProfile?.username}
                </h1>
                <p className="text-[var(--text-muted)]">@{displayProfile?.username}#{displayProfile?.discriminator}</p>
              </div>
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button 
                    onClick={() => navigate('/app/settings')}
                    variant="outline" 
                    className="border-[var(--glass-border)] text-[var(--text-secondary)]"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleFollow}
                      className={isFollowing ? 'bg-[var(--bg-layer2)] text-[var(--text-secondary)] hover:bg-[var(--bg-layer3)]' : 'btn-roblox'}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-[var(--glass-border)] text-[var(--text-secondary)]"
                    >
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {displayProfile?.bio && (
              <p className="text-[var(--text-secondary)] mt-3 max-w-2xl">{displayProfile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--text-primary)]">{displayProfile?.reels_count || 0}</p>
                <p className="text-sm text-[var(--text-muted)]">Reels</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--text-primary)]">{displayProfile?.posts_count || 0}</p>
                <p className="text-sm text-[var(--text-muted)]">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--text-primary)]">{displayProfile?.followers_count || 0}</p>
                <p className="text-sm text-[var(--text-muted)]">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[var(--text-primary)]">{displayProfile?.following_count || 0}</p>
                <p className="text-sm text-[var(--text-muted)]">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="reels" className="mt-8">
          <TabsList className="bg-[var(--bg-layer2)]">
            <TabsTrigger value="reels" className="data-[state=active]:bg-[var(--accent-primary)]">
              <Film className="w-4 h-4 mr-2" /> Reels
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-[var(--accent-primary)]">
              <MessageSquare className="w-4 h-4 mr-2" /> Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reels" className="mt-6">
            {reels.length === 0 ? (
              <div className="text-center py-12">
                <Film className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                <p className="text-[var(--text-muted)]">No reels yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {reels.map((reel) => (
                  <motion.div
                    key={reel.id}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-[9/16] bg-[var(--bg-layer2)] rounded-xl overflow-hidden cursor-pointer relative group"
                  >
                    {reel.thumbnail_url ? (
                      <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : reel.video_url ? (
                      <video src={reel.video_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-8 h-8 text-[var(--text-muted)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <p className="font-semibold">{reel.likes_count} likes</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-muted)]">No posts yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
