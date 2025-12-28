import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  Play,
  Pause,
  Plus,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

export default function ReelsSection() {
  const { user, axiosInstance } = useAuth();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const containerRef = useRef(null);

  const fetchReels = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/reels");
      setReels(response.data);
    } catch (error) {
      console.error("Failed to fetch reels:", error);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const handleLike = async (reelId) => {
    try {
      const response = await axiosInstance.post(`/reels/${reelId}/like`);
      setReels((prev) =>
        prev.map((r) => {
          if (r.id === reelId) {
            return {
              ...r,
              is_liked: response.data.liked,
              likes_count: response.data.liked
                ? r.likes_count + 1
                : r.likes_count - 1,
            };
          }
          return r;
        })
      );
    } catch (error) {
      toast.error("Failed to like reel");
    }
  };

  const openComments = async (reel) => {
    setSelectedReel(reel);
    setShowComments(true);
    try {
      const response = await axiosInstance.get(`/reels/${reel.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedReel) return;

    try {
      const response = await axiosInstance.post(
        `/reels/${selectedReel.id}/comments`,
        {
          content: commentInput.trim(),
          reel_id: selectedReel.id,
        }
      );
      setComments((prev) => [response.data, ...prev]);
      setCommentInput("");
      setReels((prev) =>
        prev.map((r) => {
          if (r.id === selectedReel.id) {
            return { ...r, comments_count: r.comments_count + 1 };
          }
          return r;
        })
      );
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
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
    <div className="h-full flex" data-testid="reels-section">
      {/* Reels Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="w-24 h-24 rounded-full bg-[var(--bg-layer2)] flex items-center justify-center mb-4">
              <Play className="w-12 h-12 text-[var(--text-muted)]" />
            </div>
            <h2 className="text-xl font-outfit font-semibold text-[var(--text-primary)] mb-2">
              No Reels Yet
            </h2>
            <p className="text-[var(--text-muted)] mb-4 text-center">
              Be the first to upload a reel!
            </p>
            <Button onClick={() => setShowUpload(true)} className="btn-roblox">
              <Plus className="w-5 h-5 mr-2" /> Upload Reel
            </Button>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="h-full w-full snap-start snap-always flex items-center justify-center relative"
            >
              {/* Video Container */}
              <div className="relative w-full max-w-md h-full md:h-[80vh] bg-[var(--bg-layer1)] md:rounded-xl overflow-hidden">
                {/* Video Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center">
                  <video
                    src={reel.video_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    autoPlay={index === currentIndex}
                  />
                  {!reel.video_url && (
                    <div className="text-center p-4">
                      <Play className="w-16 h-16 text-white/50 mx-auto mb-2" />
                      <p className="text-white/50">Video Placeholder</p>
                    </div>
                  )}
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-16 p-4">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                      <img
                        src={
                          reel.author?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.author?.username}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {reel.author?.username}
                      </p>
                      <p className="text-white/60 text-sm">
                        {formatTimestamp(reel.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-white mb-1">
                    {reel.title}
                  </h3>
                  {reel.description && (
                    <p className="text-white/80 text-sm line-clamp-2">
                      {reel.description}
                    </p>
                  )}

                  {/* Music Tag */}
                  <div className="flex items-center gap-2 mt-3">
                    <Music className="w-4 h-4 text-white/60" />
                    <p className="text-white/60 text-sm">Original Sound</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(reel.id)}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reel.is_liked
                          ? "bg-red-500"
                          : "bg-white/20 backdrop-blur"
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          reel.is_liked ? "text-white fill-white" : "text-white"
                        }`}
                      />
                    </div>
                    <span className="text-white text-sm mt-1">
                      {reel.likes_count}
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openComments(reel)}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-sm mt-1">
                      {reel.comments_count}
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-sm mt-1">Share</span>
                  </motion.button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Button (Fixed) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowUpload(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg z-40"
        data-testid="upload-reel-btn"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Upload Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">
              Upload Reel
            </DialogTitle>
          </DialogHeader>
          <UploadReelForm
            axiosInstance={axiosInstance}
            onSuccess={(reel) => {
              setReels((prev) => [reel, ...prev]);
              setShowUpload(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">
              Comments
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-[var(--text-muted)] py-8">
                No comments yet
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={comment.author?.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-[var(--text-primary)] text-sm">
                        {comment.author?.username}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleComment}
            className="flex gap-2 pt-4 border-t border-[var(--glass-border)]"
          >
            <Input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <Button type="submit" className="btn-roblox px-4">
              Post
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadReelForm({ axiosInstance, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    try {
      let videoUrl = "";

      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        const uploadResponse = await axiosInstance.post(
          "/upload/videos",
          formData
        );
        videoUrl = uploadResponse.data.url;
      }

      const response = await axiosInstance.post("/reels", {
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl,
      });

      toast.success("Reel uploaded!");
      onSuccess(response.data);
    } catch (error) {
      toast.error("Failed to upload reel");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Video Upload */}
      <div className="relative">
        {videoPreview ? (
          <div className="relative aspect-[9/16] max-h-60 bg-[var(--bg-layer2)] rounded-xl overflow-hidden">
            <video src={videoPreview} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setVideoFile(null);
                setVideoPreview(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="block aspect-video max-h-40 bg-[var(--bg-layer2)] rounded-xl border-2 border-dashed border-[var(--glass-border)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors">
            <div className="h-full flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 text-[var(--text-muted)] mb-2" />
              <p className="text-[var(--text-muted)] text-sm">
                Click to upload video
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your reel a title"
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
        data-testid="reel-title-input"
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description..."
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[80px]"
      />

      <Button
        type="submit"
        disabled={uploading}
        className="w-full btn-roblox"
        data-testid="upload-reel-submit"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Upload Reel"
        )}
      </Button>
    </form>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}
