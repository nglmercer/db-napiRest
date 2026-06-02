import { useState, useCallback } from "preact/hooks";
import { api } from "../utils/api";

interface Comment {
  id: number;
  reel_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export function useComments(reelId: number) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadComments = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (loading) return;

    setLoading(true);
    try {
      const result = await api.social.getComments(reelId, limit, currentOffset);
      const newComments = result.data as Comment[];
      
      if (reset) {
        setComments(newComments);
      } else {
        setComments((prev) => [...prev, ...newComments]);
      }
      
      setOffset(currentOffset + newComments.length);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  }, [reelId, offset, loading]);

  const postComment = useCallback(async (content: string) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, error: "unauthorized" };

    setPosting(true);
    try {
      const result = await api.social.addComment(reelId, content);
      const newComment = result.data as Comment;
      setComments((prev) => [newComment, ...prev]);
      setPosting(false);
      return { success: true };
    } catch (error) {
      setPosting(false);
      console.error("Failed to post comment:", error);
      return { success: false, error: "failed" };
    }
  }, [reelId]);

  const deleteComment = useCallback(async (commentId: number) => {
    try {
      await api.social.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete comment:", error);
      return { success: false, error: "failed" };
    }
  }, []);

  return { comments, loading, posting, hasMore, loadComments, postComment, deleteComment };
}
