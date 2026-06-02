import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { JobManager } from "../src/utils/jobManager.js";

describe("JobManager", () => {
  test("should create a job", () => {
    const job = JobManager.createJob("test_1", "http://example.com/video.mp4", "hls");
    expect(job.id).toBe("test_1");
    expect(job.status).toBe("pending");
    expect(job.progress).toBe(0);
  });

  test("should get a job", () => {
    const job = JobManager.getJob("test_1");
    expect(job).toBeDefined();
    expect(job?.id).toBe("test_1");
  });

  test("should update a job", () => {
    const job = JobManager.updateJob("test_1", { status: "processing", progress: 50 });
    expect(job?.status).toBe("processing");
    expect(job?.progress).toBe(50);
  });

  test("should subscribe to job updates", () => {
    let receivedJob: any = null;
    const unsubscribe = JobManager.subscribe("test_1", (job) => {
      receivedJob = job;
    });

    JobManager.updateJob("test_1", { progress: 75 });
    expect(receivedJob?.progress).toBe(75);

    unsubscribe();
  });

  test("should get active jobs", () => {
    const activeJobs = JobManager.getActiveJobs();
    expect(activeJobs.length).toBeGreaterThan(0);
  });
});
