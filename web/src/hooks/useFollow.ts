import { useState, useCallback } from "preact/hooks";
import { api } from "../utils/api";

export function useFollow() {
  const [followingUserId, setFollowingUserId] = useState<number | null>(null);

  const toggleFollow = useCallback(async (userId: number, isFollowing: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, error: "unauthorized" };

    setFollowingUserId(userId);
    try {
      if (isFollowing) {
        await api.social.unfollow(userId);
        setFollowingUserId(null);
        return { success: true, following: false };
      } else {
        await api.social.follow(userId);
        setFollowingUserId(null);
        return { success: true, following: true };
      }
    } catch (error) {
      setFollowingUserId(null);
      console.error("Failed to toggle follow:", error);
      return { success: false, error: "failed" };
    }
  }, []);

  return { followingUserId, toggleFollow };
}
