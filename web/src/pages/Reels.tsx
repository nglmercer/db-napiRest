import { useEffect, useState } from "preact/hooks";
import { api } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../components/Router";

interface Reel {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  user_id: number;
  created_at: string;
}

export function Reels() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.crud.list<Reel>("reels")
      .then((res) => setReels(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div class="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold gradient-text">Your Reels</h1>
          <p class="text-[var(--text2)] text-sm mt-1">Create and manage your short videos</p>
        </div>
        <button class="btn-primary" onClick={() => navigate("/create")}>
          + Create Reel
        </button>
      </div>

      {reels.length === 0 ? (
        <div class="card text-center py-16">
          <div class="text-6xl mb-4">🎬</div>
          <h2 class="text-xl font-semibold mb-2">No reels yet</h2>
          <p class="text-[var(--text2)] mb-4">Create your first reel to get started</p>
          <button class="btn-primary" onClick={() => navigate("/create")}>
            Create Your First Reel
          </button>
        </div>
      ) : (
        <div class="reel-grid">
          {reels.map((reel) => (
            <div key={reel.id} class="reel-card group">
              {reel.thumbnail_url ? (
                <img
                  src={reel.thumbnail_url}
                  alt={reel.title}
                  class="w-full h-full object-cover"
                />
              ) : (
                <div class="flex items-center justify-center h-full text-4xl text-[var(--text2)]">
                  ▶
                </div>
              )}
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <h3 class="font-semibold text-sm truncate">{reel.title}</h3>
                <p class="text-xs text-[var(--text2)] truncate">{reel.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
