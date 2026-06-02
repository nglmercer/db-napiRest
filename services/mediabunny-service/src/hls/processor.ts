import { mkdir } from "fs/promises";
import { join } from "path";
import { config } from "../../config/index.js";
import { JobManager } from "../utils/jobManager.js";
import { HLSGenerator } from "./generator.js";

export class VideoProcessor {
  async process(jobId: string, inputUrl: string, outputFormat: string, options: any): Promise<void> {
    try {
      // Update job status
      JobManager.updateJob(jobId, { status: "processing", progress: 0 });

      // Create output directory
      const outputDir = join(config.outputDir, jobId);
      await mkdir(outputDir, { recursive: true });

      // Process based on output format
      if (outputFormat === "hls") {
        await this.processHLS(jobId, inputUrl, outputDir, options);
      } else {
        throw new Error(`Unsupported output format: ${outputFormat}`);
      }

      // Update job as completed
      const outputUrl = `/hls/${jobId}/playlist.m3u8`;
      JobManager.updateJob(jobId, { status: "completed", progress: 100, outputUrl });
    } catch (error: any) {
      JobManager.updateJob(jobId, { status: "failed", error: error.message });
      throw error;
    }
  }

  private async processHLS(jobId: string, inputUrl: string, outputDir: string, options: any): Promise<void> {
    const generator = new HLSGenerator();
    
    // Simulate processing progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      JobManager.updateJob(jobId, { progress: i });
    }

    // Generate HLS playlist
    await generator.generate(inputUrl, outputDir, {
      segmentDuration: options.segmentDuration || config.hlsSegmentDuration,
      playlistSize: options.playlistSize || config.hlsPlaylistSize,
    });
  }
}
