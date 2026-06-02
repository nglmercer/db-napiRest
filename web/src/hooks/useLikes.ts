import { useState, useCallback } from "preact/hooks";
import { api } from "../utils/api";

export function useLikes() {
  const [likingReelId, setLikingReelId] = useState<number | null>(null);

  const toggleLike = useCallback(async (reelId: number, isLiked: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, error: "unauthorized" };

    setLikingReelId(reelId);
    try {
      if (isLiked) {
        const result = await api.social.unlike(reelId);
        setLikingReelId(null);
        return { success: true, liked: false, likes_count: result.likes_count };
      } else {
        const result = await api.social.like(reelId);
        setLikingReelId(null);
        return { success: true, liked: true, likes_count: result.likes_count };
      }
    } catch (error) {
      setLikingReelId(null);
      console.error("Failed to toggle like:", error);
      return { success: false, error: "failed" };
    }
  }, []);

  return { likingReelId, toggleLike };
}
