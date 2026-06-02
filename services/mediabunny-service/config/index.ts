export const config = {
  port: parseInt(process.env.PORT || "3002"),
  wsPort: parseInt(process.env.WS_PORT || "3003"),
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  outputDir: process.env.OUTPUT_DIR || "./outputs",
  hlsSegmentDuration: parseInt(process.env.HLS_SEGMENT_DURATION || "6"),
  hlsPlaylistSize: parseInt(process.env.HLS_PLAYLIST_SIZE || "10"),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || "3"),
};
