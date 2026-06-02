interface ShareButtonProps {
  reelId: number;
  sharesCount: number;
  onShare: () => void;
}

export function ShareButton({ reelId, sharesCount, onShare }: ShareButtonProps) {
  const handleClick = async (e: Event) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/#/reel/${reelId}`;
    const shareText = `Check out this reel!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this reel",
          text: shareText,
          url: shareUrl,
        });
        onShare();
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
        onShare();
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  return (
    <button class="share-btn" onClick={handleClick}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
      </svg>
      <span>{formatCount(sharesCount)}</span>
    </button>
  );
}
