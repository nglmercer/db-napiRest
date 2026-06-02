import { Context } from "hono";
import { VideoProcessor } from "../../hls/processor.js";
import { config } from "../../../config/index.js";

export async function processVideoHandler(c: Context) {
  try {
    const body = await c.req.json();
    const { inputUrl, outputFormat, options } = body;

    if (!inputUrl) {
      return c.json({ error: "inputUrl is required" }, 400);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const processor = new VideoProcessor();

    // Start processing asynchronously
    processor.process(jobId, inputUrl, outputFormat || "hls", options || {}).catch((err) => {
      console.error(`Job ${jobId} failed:`, err);
    });

    return c.json({
      jobId,
      status: "processing",
      message: "Video processing started",
    });
  } catch (error) {
    console.error("Process handler error:", error);
    return c.json({ error: "Failed to start video processing" }, 500);
  }
}
