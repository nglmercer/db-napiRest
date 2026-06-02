import { useState, useEffect } from "preact/hooks";
import { useRouter } from "../components/Router";
import { useAuth } from "../hooks/useAuth";
import { useFollow } from "../hooks/useFollow";
import { api } from "../utils/api";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

interface UserReel {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

export function Profile({ userId }: { userId?: number }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reels, setReels] = useState<UserReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const { navigate, path } = useRouter();
  const { user } = useAuth();
  const { followingUserId, toggleFollow } = useFollow();

  const targetUserId = userId || Number(path.split("/").pop());

  useEffect(() => {
    if (targetUserId && user) {
      setIsOwnProfile(targetUserId === Number(user.id));
    }
  }, [targetUserId, user]);

  useEffect(() => {
    if (!targetUserId) return;

    setLoading(true);
    api.feed.userReels(targetUserId, 50, 0)
      .then((res) => {
        setProfile(res.user as UserProfile);
        setReels(res.data as UserReel[]);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
      })
      .finally(() => setLoading(false));
  }, [targetUserId]);

  const handleFollow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const result = await toggleFollow(targetUserId, profile?.is_following || false);
    if (result.success && profile) {
      setProfile({
        ...profile,
        is_following: result.following!,
        followers_count: profile.followers_count + (result.following ? 1 : -1),
      });
    }
  };

  if (loading) {
    return (
      <div class="profile-loading">
        <div class="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div class="profile-error">
        <p>Profile not found</p>
        <button onClick={() => navigate("/")} class="btn-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div class="profile-page">
      <div class="profile-header">
        <div class="profile-cover"></div>
        <div class="profile-info">
          <div class="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2>{profile.name}</h2>
          <p class="profile-email">@{profile.email.split("@")[0]}</p>

          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{profile.following_count}</span>
              <span class="stat-label">Following</span>
            </div>
            <div class="stat">
              <span class="stat-value">{profile.followers_count}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat">
              <span class="stat-value">{reels.length}</span>
              <span class="stat-label">Reels</span>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              class={`follow-button ${profile.is_following ? "following" : ""}`}
              onClick={handleFollow}
              disabled={followingUserId === targetUserId}
            >
              {followingUserId === targetUserId
                ? "..."
                : profile.is_following
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div class="profile-reels">
        <h3>Reels</h3>
        {reels.length === 0 ? (
          <div class="empty-reels">
            <p>No reels yet</p>
          </div>
        ) : (
          <div class="reels-grid">
            {reels.map((reel) => (
              <div
                key={reel.id}
                class="reel-thumbnail"
                onClick={() => navigate(`/reel/${reel.id}`)}
              >
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.title} />
                ) : (
                  <div class="reel-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
                <div class="reel-stats">
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    {reel.views}
                  </span>
                  <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {reel.likes_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
