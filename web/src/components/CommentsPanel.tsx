import { useState, useEffect } from "preact/hooks";
import { useComments } from "../hooks/useComments";

interface CommentsPanelProps {
  reelId: number;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export function CommentsPanel({ reelId, isOpen, onClose, isLoggedIn, onLoginRequired }: CommentsPanelProps) {
  const { comments, loading, posting, hasMore, loadComments, postComment } = useComments(reelId);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadComments(true);
    }
  }, [isOpen, reelId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    if (!newComment.trim()) return;

    const result = await postComment(newComment.trim());
    if (result.success) {
      setNewComment("");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  if (!isOpen) return null;

  return (
    <div class="comments-overlay" onClick={onClose}>
      <div class="comments-panel" onClick={(e) => e.stopPropagation()}>
        <div class="comments-header">
          <h3>{comments.length} comments</h3>
          <button class="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="comments-list">
          {loading && comments.length === 0 ? (
            <div class="loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div class="empty">No comments yet. Be the first!</div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} class="comment">
                  <div class="comment-avatar">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-user">{comment.user_name}</span>
                      <span class="comment-time">{formatTime(comment.created_at)}</span>
                    </div>
                    <p class="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))}
              {hasMore && !loading && (
                <button class="load-more" onClick={() => loadComments(false)}>
                  Load more
                </button>
              )}
              {loading && comments.length > 0 && (
                <div class="loading">Loading...</div>
              )}
            </>
          )}
        </div>

        <form class="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={isLoggedIn ? "Add a comment..." : "Login to comment"}
            value={newComment}
            onInput={(e) => setNewComment((e.target as HTMLInputElement).value)}
            disabled={!isLoggedIn || posting}
          />
          <button type="submit" disabled={!isLoggedIn || posting || !newComment.trim()}>
            {posting ? "..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
