export interface Job {
  id: string;
  inputUrl: string;
  outputFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  outputUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

type JobSubscriber = (job: Job) => void;

class JobManagerClass {
  private jobs: Map<string, Job> = new Map();
  private subscribers: Map<string, Set<JobSubscriber>> = new Map();

  createJob(id: string, inputUrl: string, outputFormat: string): Job {
    const job: Job = {
      id,
      inputUrl,
      outputFormat,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates, updatedAt: new Date() };
    this.jobs.set(id, updatedJob);

    // Notify subscribers
    this.notifySubscribers(id, updatedJob);

    return updatedJob;
  }

  subscribe(jobId: string, callback: JobSubscriber): () => void {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set());
    }
    this.subscribers.get(jobId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(jobId)?.delete(callback);
    };
  }

  private notifySubscribers(jobId: string, job: Job) {
    const subscribers = this.subscribers.get(jobId);
    if (subscribers) {
      subscribers.forEach((callback) => callback(job));
    }
  }

  getActiveJobs(): Job[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === "pending" || job.status === "processing"
    );
  }

  getCompletedJobs(): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === "completed");
  }

  getFailedJobs(): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === "failed");
  }
}

export const JobManager = new JobManagerClass();
