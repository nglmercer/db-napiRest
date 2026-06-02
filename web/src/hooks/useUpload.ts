import { useState, useCallback } from "preact/hooks";
import { api } from "../utils/api";

interface UploadData {
  title: string;
  description?: string;
  music?: string;
  hashtags?: string;
  videoFile?: File;
  videoUrl?: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (data: UploadData) => {
    setUploading(true);
    setProgress(0);

    try {
      if (data.videoFile) {
        const formData = new FormData();
        formData.append("video", data.videoFile);
        formData.append("title", data.title);
        if (data.description) formData.append("description", data.description);
        if (data.music) formData.append("music", data.music);
        if (data.hashtags) formData.append("hashtags", data.hashtags);

        const result = await api.upload.video(formData);
        setProgress(100);
        setUploading(false);
        return { success: true, data: result.data };
      } else if (data.videoUrl) {
        const result = await api.reels.create({
          title: data.title,
          description: data.description || null,
          video_url: data.videoUrl,
          thumbnail_url: null,
          music: data.music || null,
          hashtags: data.hashtags || null,
        });
        setProgress(100);
        setUploading(false);
        return { success: true, data: result.data };
      } else {
        setUploading(false);
        return { success: false, error: "No video provided" };
      }
    } catch (error) {
      setUploading(false);
      console.error("Failed to upload:", error);
      return { success: false, error: "Upload failed" };
    }
  }, []);

  return { uploading, progress, upload };
}
