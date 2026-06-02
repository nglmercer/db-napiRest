import { VideoProcessor } from "../hls/processor.js";
import { JobManager } from "../utils/jobManager.js";

const workerId = process.env.WORKER_ID || "unknown";

console.log(`Worker ${workerId} started`);

process.on("message", async (message: any) => {
  const { type, jobId, inputUrl, outputFormat, options } = message;

  if (type === "process") {
    console.log(`Worker ${workerId} processing job ${jobId}`);
    
    const processor = new VideoProcessor();

    // Subscribe to job updates and send to parent
    JobManager.subscribe(jobId, (job) => {
      process.send?.({
        type: "job_update",
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        outputUrl: job.outputUrl,
      });
    });

    try {
      await processor.process(jobId, inputUrl, outputFormat, options);
      process.send?.({ type: "job_completed", jobId, workerId });
    } catch (error: any) {
      process.send?.({ type: "job_failed", jobId, error: error.message, workerId });
    }
  }
});

// Keep worker alive
setInterval(() => {}, 1000);
