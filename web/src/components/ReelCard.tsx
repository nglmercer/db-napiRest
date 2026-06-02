import { useState } from "preact/hooks";
import { VideoPlayer } from "./VideoPlayer";
import { LikeButton } from "./LikeButton";
import { CommentsPanel } from "./CommentsPanel";
import { ShareButton } from "./ShareButton";
import { useLikes } from "../hooks/useLikes";
import { api } from "../utils/api";

interface Reel {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  music: string | null;
  hashtags: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_name: string;
  user_email: string;
  is_liked: number;
  is_following: number;
}

interface ReelCardProps {
  reel: Reel;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNavigate: (path: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export function ReelCard({ reel, isPlaying, onPlay, onPause, onNavigate, isLoggedIn, onLoginRequired }: ReelCardProps) {
  const [isLiked, setIsLiked] = useState(reel.is_liked === 1);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [isFollowing, setIsFollowing] = useState(reel.is_following === 1);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { toggleLike } = useLikes();

  const handleLike = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    const result = await toggleLike(reel.id, isLiked);
    if (result.success) {
      setIsLiked(result.liked!);
      setLikesCount(result.likes_count!);
    }
  };

  const handleFollow = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    try {
      if (isFollowing) {
        await api.social.unfollow(reel.user_id);
        setIsFollowing(false);
      } else {
        await api.social.follow(reel.user_id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  const handleShare = async () => {
    try {
      await api.social.share(reel.id);
    } catch (error) {
      console.error("Failed to track share:", error);
    }
  };

  return (
    <div class="reel-card">
      <VideoPlayer
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
      />

      <div class="reel-overlay">
        <div class="reel-info">
          <div class="user-info" onClick={() => onNavigate(`/profile/${reel.user_id}`)}>
            <div class="avatar">{reel.user_name.charAt(0).toUpperCase()}</div>
            <span class="username">@{reel.user_name}</span>
            {!isFollowing && reel.user_id !== Number(localStorage.getItem("userId")) && (
              <button class="follow-btn" onClick={handleFollow}>
                Follow
              </button>
            )}
          </div>

          <div class="reel-details">
            <p class="title">{reel.title}</p>
            {reel.description && <p class="description">{reel.description}</p>}
            {reel.hashtags && <p class="hashtags">{reel.hashtags}</p>}
            {reel.music && (
              <div class="music">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <span>{reel.music}</span>
              </div>
            )}
          </div>
        </div>

        <div class="action-buttons">
          <LikeButton
            isLiked={isLiked}
            likesCount={likesCount}
            onLike={handleLike}
            onUnlike={handleLike}
          />
          
          <button class="comment-btn" onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
            <span>{reel.comments_count}</span>
          </button>

          <ShareButton
            reelId={reel.id}
            sharesCount={reel.shares_count}
            onShare={handleShare}
          />
        </div>
      </div>

      <CommentsPanel
        reelId={reel.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        isLoggedIn={isLoggedIn}
        onLoginRequired={onLoginRequired}
      />
    </div>
  );
}
