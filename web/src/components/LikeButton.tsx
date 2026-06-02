import { useState } from "preact/hooks";

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  onUnlike: () => void;
  disabled?: boolean;
}

export function LikeButton({ isLiked, likesCount, onLike, onUnlike, disabled }: LikeButtonProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: Event) => {
    e.stopPropagation();
    if (disabled) return;

    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    if (isLiked) {
      onUnlike();
    } else {
      onLike();
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  return (
    <button class="like-btn" onClick={handleClick} disabled={disabled}>
      <div class={`like-icon ${animating ? "animating" : ""} ${isLiked ? "liked" : ""}`}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill={isLiked ? "#fe2c55" : "none"} stroke="white" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <span class="like-count">{formatCount(likesCount)}</span>
    </button>
  );
}
