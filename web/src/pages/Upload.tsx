import { useState } from "preact/hooks";
import { useUpload } from "../hooks/useUpload";
import { useRouter } from "../components/Router";
import { useAuth } from "../hooks/useAuth";

export function Upload() {
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [music, setMusic] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { uploading, progress, upload } = useUpload();
  const { navigate } = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div class="upload-unauthorized">
        <h2>Login Required</h2>
        <p>You need to be logged in to upload content.</p>
        <button onClick={() => navigate("/login")} class="btn-primary">
          Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (uploadMode === "file" && !videoFile) {
      setError("Please select a video file");
      return;
    }

    if (uploadMode === "url" && !videoUrl.trim()) {
      setError("Video URL is required");
      return;
    }

    const result = await upload({
      title: title.trim(),
      description: description.trim() || undefined,
      music: music.trim() || undefined,
      hashtags: hashtags.trim() || undefined,
      videoFile: uploadMode === "file" ? videoFile! : undefined,
      videoUrl: uploadMode === "url" ? videoUrl.trim() : undefined,
    });

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Upload failed");
    }
  };

  return (
    <div class="upload-page">
      <div class="upload-header">
        <button onClick={() => navigate("/")} class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1>Upload Reel</h1>
      </div>

      <form onSubmit={handleSubmit} class="upload-form">
        {error && <div class="error-message">{error}</div>}

        <div class="upload-mode-toggle">
          <button
            type="button"
            class={uploadMode === "file" ? "active" : ""}
            onClick={() => setUploadMode("file")}
          >
            Upload File
          </button>
          <button
            type="button"
            class={uploadMode === "url" ? "active" : ""}
            onClick={() => setUploadMode("url")}
          >
            Video URL
          </button>
        </div>

        {uploadMode === "file" ? (
          <div class="file-upload">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                setVideoFile(files ? files[0] : null);
              }}
              disabled={uploading}
            />
            {videoFile && <p class="file-name">{videoFile.name}</p>}
          </div>
        ) : (
          <input
            type="url"
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onInput={(e) => setVideoUrl((e.target as HTMLInputElement).value)}
            disabled={uploading}
            class="input-field"
          />
        )}

        <input
          type="text"
          placeholder="Title *"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          disabled={uploading}
          class="input-field"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          disabled={uploading}
          class="input-field"
          rows={3}
        />

        <input
          type="text"
          placeholder="Music (optional)"
          value={music}
          onInput={(e) => setMusic((e.target as HTMLInputElement).value)}
          disabled={uploading}
          class="input-field"
        />

        <input
          type="text"
          placeholder="#hashtags (optional)"
          value={hashtags}
          onInput={(e) => setHashtags((e.target as HTMLInputElement).value)}
          disabled={uploading}
          class="input-field"
        />

        {uploading && (
          <div class="upload-progress">
            <div class="progress-bar" style={{ width: `${progress}%` }}></div>
            <span>Uploading... {progress}%</span>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !title.trim()}
          class="btn-primary upload-submit"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
