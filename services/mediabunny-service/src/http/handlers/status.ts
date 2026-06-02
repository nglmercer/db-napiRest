import { Context } from "hono";
import { JobManager } from "../../utils/jobManager.js";

export async function statusHandler(c: Context) {
  try {
    const jobId = c.req.param("jobId");
    const job = JobManager.getJob(jobId);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      outputUrl: job.outputUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error("Status handler error:", error);
    return c.json({ error: "Failed to get job status" }, 500);
  }
}
