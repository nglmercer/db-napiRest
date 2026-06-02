import { spawn, ChildProcess } from "child_process";
import { VideoProcessor } from "../hls/processor.js";
import { JobManager } from "../utils/jobManager.js";

interface IPCMessage {
  type: string;
  jobId?: string;
  inputUrl?: string;
  outputFormat?: string;
  options?: any;
  workerId?: string;
}

export class IPCServer {
  private workers: Map<string, ChildProcess> = new Map();
  private maxWorkers = 3;

  async start() {
    // Initialize worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      await this.spawnWorker(`worker_${i}`);
    }
  }

  private async spawnWorker(workerId: string): Promise<void> {
    const worker = spawn("bun", ["run", "src/ipc/worker.ts"], {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      env: { ...process.env, WORKER_ID: workerId },
    });

    this.workers.set(workerId, worker);

    worker.on("message", (message: IPCMessage) => {
      this.handleWorkerMessage(workerId, message);
    });

    worker.on("exit", (code) => {
      console.log(`Worker ${workerId} exited with code ${code}`);
      this.workers.delete(workerId);
      // Respawn worker
      setTimeout(() => this.spawnWorker(workerId), 1000);
    });

    worker.on("error", (error) => {
      console.error(`Worker ${workerId} error:`, error);
    });

    console.log(`Worker ${workerId} spawned`);
  }

  private handleWorkerMessage(workerId: string, message: IPCMessage) {
    const { type, jobId, status, progress, error, outputUrl } = message as any;

    switch (type) {
      case "job_update":
        JobManager.updateJob(jobId, { status, progress, error, outputUrl });
        break;
      case "job_completed":
        console.log(`Worker ${workerId} completed job ${jobId}`);
        break;
      case "job_failed":
        console.error(`Worker ${workerId} failed job ${jobId}:`, error);
        break;
    }
  }

  async processVideo(inputUrl: string, outputFormat: string = "hls", options: any = {}): Promise<string> {
    const jobId = `ipc_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find available worker
    const workerId = Array.from(this.workers.keys())[0];
    
    if (!workerId) {
      throw new Error("No available workers");
    }
    
    const worker = this.workers.get(workerId);

    if (!worker) {
      throw new Error("No available workers");
    }

    // Create job
    JobManager.createJob(jobId, inputUrl, outputFormat);

    // Send message to worker
    worker.send({
      type: "process",
      jobId,
      inputUrl,
      outputFormat,
      options,
      workerId,
    });

    return jobId;
  }

  async stop() {
    for (const [workerId, worker] of this.workers) {
      console.log(`Stopping worker ${workerId}`);
      worker.kill();
    }
    this.workers.clear();
  }
}
