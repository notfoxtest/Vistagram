import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { 
  MessageSquare, Eye, Clock, ChevronRight, Plus, ArrowLeft, 
  Megaphone, HelpCircle, Sparkles, BookOpen, Upload, Loader2, Image
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const categoryIcons = {
  'megaphone': Megaphone,
  'help-circle': HelpCircle,
  'sparkles': Sparkles,
  'book': BookOpen,
  'message-circle': MessageSquare,
};

export default function ForumSection() {
  const { user, axiosInstance } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [view, setView] = useState('categories'); // categories | posts | post

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/forum/categories');
      setCategories(response.data);
      if (response.data.length === 0) {
        // Seed default categories
        await axiosInstance.post('/seed/forum');
        const newResponse = await axiosInstance.get('/forum/categories');
        setCategories(newResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  const fetchPosts = useCallback(async (categoryId = null) => {
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await axiosInstance.get('/forum/posts', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }, [axiosInstance]);

  const fetchPost = useCallback(async (postId) => {
    try {
      const [postResponse, repliesResponse] = await Promise.all([
        axiosInstance.get(`/forum/posts/${postId}`),
        axiosInstance.get(`/forum/posts/${postId}/replies`)
      ]);
      setSelectedPost(postResponse.data);
      setReplies(repliesResponse.data);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchPosts(category.id);
    setView('posts');
  };

  const handlePostClick = (post) => {
    fetchPost(post.id);
    setView('post');
  };

  const handleBack = () => {
    if (view === 'post') {
      setView('posts');
      setSelectedPost(null);
    } else if (view === 'posts') {
      setView('categories');
      setSelectedCategory(null);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedPost) return;

    try {
      const response = await axiosInstance.post(`/forum/posts/${selectedPost.id}/replies`, {
        content: replyInput.trim(),
        post_id: selectedPost.id
      });
      setReplies(prev => [...prev, response.data]);
      setReplyInput('');
      toast.success('Reply posted!');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="forum-section">
      {/* Header */}
      <div className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--bg-layer1)]/50">
        <div className="flex items-center gap-3">
          {view !== 'categories' && (
            <button onClick={handleBack} className="p-2 hover:bg-[var(--glass-panel)] rounded-lg">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
          <h1 className="text-lg font-outfit font-semibold text-[var(--text-primary)]">
            {view === 'categories' ? 'Forum' : view === 'posts' ? selectedCategory?.name : selectedPost?.title}
          </h1>
        </div>
        {view === 'posts' && (
          <Button onClick={() => setShowCreatePost(true)} className="btn-roblox" data-testid="create-post-btn">
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {view === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.icon] || MessageSquare;
                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleCategoryClick(category)}
                    className="glass-card p-4 cursor-pointer hover:border-[var(--accent-primary)]/50 transition-all"
                    style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                    data-testid={`category-${category.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-outfit font-semibold text-[var(--text-primary)]">{category.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2">{category.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                          <span>{category.posts_count || 0} posts</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {view === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                  <p className="text-[var(--text-muted)]">No posts yet</p>
                  <Button onClick={() => setShowCreatePost(true)} className="btn-roblox mt-4">
                    Create First Post
                  </Button>
                </div>
              ) : (
                posts.map((post) => (
                  <motion.div
                    key={post.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handlePostClick(post)}
                    className="glass-card p-4 cursor-pointer hover:border-[var(--accent-primary)]/50 transition-all"
                    data-testid={`post-${post.id}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img src={post.author?.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {post.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {post.replies_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTimestamp(post.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {view === 'post' && selectedPost && (
            <motion.div
              key="post"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Original Post */}
              <div className="glass-card p-4 md:p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img src={selectedPost.author?.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--text-primary)]">{selectedPost.author?.username}</span>
                      <span className="text-xs text-[var(--text-muted)]">{formatTimestamp(selectedPost.created_at)}</span>
                    </div>
                    <h2 className="text-xl font-outfit font-semibold text-[var(--text-primary)] mb-3">{selectedPost.title}</h2>
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{selectedPost.content}</p>
                    
                    {/* Attachments */}
                    {selectedPost.attachments?.length > 0 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {selectedPost.attachments.map((url, i) => (
                          <img key={i} src={url} alt="" className="h-32 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--glass-border)] text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {selectedPost.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> {replies.length} replies
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Replies</h3>
                {replies.length === 0 ? (
                  <p className="text-center text-[var(--text-muted)] py-8">No replies yet</p>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className="glass-card p-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <img src={reply.author?.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[var(--text-primary)]">{reply.author?.username}</span>
                            <span className="text-xs text-[var(--text-muted)]">{formatTimestamp(reply.created_at)}</span>
                          </div>
                          <p className="text-[var(--text-secondary)]">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReply} className="glass-card p-4">
                <Textarea
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Write a reply..."
                  className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[100px] mb-3"
                  data-testid="reply-input"
                />
                <div className="flex justify-end">
                  <Button type="submit" className="btn-roblox" data-testid="reply-submit">
                    Post Reply
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Create Post</DialogTitle>
          </DialogHeader>
          <CreatePostForm 
            axiosInstance={axiosInstance} 
            categoryId={selectedCategory?.id}
            onSuccess={(post) => { 
              setPosts(prev => [post, ...prev]); 
              setShowCreatePost(false); 
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatePostForm({ axiosInstance, categoryId, onSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosInstance.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments(prev => [...prev, response.data.url]);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await axiosInstance.post('/forum/posts', {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        attachments
      });
      toast.success('Post created!');
      onSuccess(response.data);
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
        data-testid="post-title-input"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your post content..."
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[150px]"
        data-testid="post-content-input"
      />
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachments.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="h-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-layer2)] rounded-lg cursor-pointer hover:bg-[var(--bg-layer3)] transition-colors">
          <Image className="w-5 h-5 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">{uploading ? 'Uploading...' : 'Add Image'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>
      </div>

      <Button type="submit" className="w-full btn-roblox" data-testid="post-submit">
        Create Post
      </Button>
    </form>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
