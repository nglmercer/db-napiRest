import { useState } from "preact/hooks";
import { api } from "../utils/api";
import { useRouter } from "../components/Router";

export function CreateReel() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!title || !videoUrl) {
      setError("Title and video URL are required");
      return;
    }

    setLoading(true);
    try {
      await api.reels.create({ title, description, video_url: videoUrl, thumbnail_url: thumbnailUrl });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold gradient-text mb-2">Create Reel</h1>
      <p class="text-[var(--text2)] text-sm mb-8">Fill in the details for your new short video</p>

      <div class="card">
        {error && (
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} class="flex flex-col gap-5">
          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Title *</label>
            <input
              class="input-field"
              type="text"
              placeholder="My awesome reel"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Description</label>
            <textarea
              class="input-field resize-none"
              rows={3}
              placeholder="What's this reel about?"
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Video URL *</label>
            <input
              class="input-field"
              type="url"
              placeholder="https://example.com/video.mp4"
              value={videoUrl}
              onInput={(e) => setVideoUrl((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Thumbnail URL</label>
            <input
              class="input-field"
              type="url"
              placeholder="https://example.com/thumbnail.jpg"
              value={thumbnailUrl}
              onInput={(e) => setThumbnailUrl((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="flex gap-3">
            <button type="button" class="flex-1 py-3 rounded-full border border-[#333] text-[var(--text2)] hover:bg-[var(--surface2)] transition cursor-pointer" onClick={() => navigate("/")}>
              Cancel
            </button>
            <button class="btn-primary flex-1" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Reel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
