import { useState, useEffect, useRef } from "preact/hooks";
import { useFeed } from "../hooks/useFeed";
import { ReelCard } from "../components/ReelCard";
import { LoginModal } from "../components/LoginModal";
import { useRouter } from "../components/Router";
import { useAuth } from "../hooks/useAuth";

export function Feed() {
  const { reels, loading, hasMore, loadMore, refresh } = useFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { navigate } = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (reels.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const index = Math.round(container.scrollTop / container.clientHeight);
        setCurrentIndex(index);

        if (index >= reels.length - 3 && hasMore && !loading) {
          loadMore();
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [reels.length, hasMore, loading, loadMore]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      
      e.preventDefault();
      const container = containerRef.current;
      const direction = e.deltaY > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(currentIndex + direction, reels.length - 1));
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        container.scrollTo({
          top: newIndex * container.clientHeight,
          behavior: "smooth"
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [currentIndex, reels.length]);

  if (loading && reels.length === 0) {
    return (
      <div class="feed-loading">
        <div class="spinner"></div>
        <p>Loading reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div class="feed-empty">
        <p>No reels available yet.</p>
        <button onClick={refresh} class="btn-primary">Refresh</button>
      </div>
    );
  }

  return (
    <div class="feed-container" ref={containerRef}>
      {reels.map((reel, index) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          isPlaying={index === currentIndex}
          onPlay={() => setCurrentIndex(index)}
          onPause={() => {}}
          onNavigate={navigate}
          isLoggedIn={!!user}
          onLoginRequired={() => setShowLoginModal(true)}
        />
      ))}
      
      {loading && reels.length > 0 && (
        <div class="feed-loading-more">
          <div class="spinner"></div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
