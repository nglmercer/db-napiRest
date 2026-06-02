import { useState } from "preact/hooks";
import { useRouter } from "../components/Router";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";

interface SearchResult {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  user_name: string;
  user_id: number;
}

export function Discover() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [showTrending, setShowTrending] = useState(true);

  const { navigate } = useRouter();
  const { user } = useAuth();

  useState(() => {
    api.feed.trending(20)
      .then((res) => setTrending(res.data as SearchResult[]))
      .catch(console.error);
  });

  const handleSearch = async (e: Event) => {
    e.preventDefault();
    if (!query.trim()) {
      setShowTrending(true);
      return;
    }

    setShowTrending(false);
    setLoading(true);
    try {
      const res = await api.feed.search(query.trim(), 20);
      setResults(res.data as SearchResult[]);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const displayReels = showTrending ? trending : results;

  return (
    <div class="discover-page">
      <div class="discover-header">
        <h1>Discover</h1>
        <form onSubmit={handleSearch} class="search-form">
          <input
            type="text"
            placeholder="Search reels, users, hashtags..."
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            class="search-input"
          />
          <button type="submit" class="search-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>
      </div>

      {loading ? (
        <div class="discover-loading">
          <div class="spinner"></div>
        </div>
      ) : displayReels.length === 0 ? (
        <div class="discover-empty">
          <p>{showTrending ? "No trending reels yet" : "No results found"}</p>
        </div>
      ) : (
        <div class="discover-grid">
          {!showTrending && <h2>Search Results</h2>}
          {showTrending && <h2>Trending Now</h2>}
          {displayReels.map((reel) => (
            <div
              key={reel.id}
              class="discover-reel"
              onClick={() => navigate(`/reel/${reel.id}`)}
            >
              {reel.thumbnail_url ? (
                <img src={reel.thumbnail_url} alt={reel.title} />
              ) : (
                <div class="reel-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
              <div class="discover-reel-info">
                <h3>{reel.title}</h3>
                <p class="discover-user">@{reel.user_name}</p>
                <div class="discover-stats">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {reel.likes_count}
                  </span>
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                    </svg>
                    {reel.comments_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
