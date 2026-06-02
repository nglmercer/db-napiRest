import { useState, useCallback, useRef } from "preact/hooks";

interface FeedReel {
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

interface UseFeedReturn {
  reels: FeedReel[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFeed(): UseFeedReturn {
  const [reels, setReels] = useState<FeedReel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const limit = 20;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/feed?limit=${limit}&offset=${offsetRef.current}`, {
        headers,
      });
      const data = await res.json();

      if (res.ok) {
        setReels((prev) => [...prev, ...(data.data as FeedReel[])]);
        offsetRef.current += data.data.length;
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  const refresh = useCallback(async () => {
    setReels([]);
    offsetRef.current = 0;
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  return { reels, loading, hasMore, loadMore, refresh };
}
