import { WebSocketServer, WebSocket } from "ws";
import { VideoProcessor } from "../hls/processor.js";
import { JobManager } from "../utils/jobManager.js";

export function startWebSocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 New WebSocket connection");

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        await handleMessage(ws, data);
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: "connected", message: "WebSocket connection established" }));
  });

  return wss;
}

async function handleMessage(ws: WebSocket, data: any) {
  const { type, jobId, inputUrl, outputFormat, options } = data;

  switch (type) {
    case "process":
      await handleProcessRequest(ws, inputUrl, outputFormat, options);
      break;
    case "status":
      handleStatusRequest(ws, jobId);
      break;
    case "subscribe":
      handleSubscribeRequest(ws, jobId);
      break;
    default:
      ws.send(JSON.stringify({ type: "error", error: "Unknown message type" }));
  }
}

async function handleProcessRequest(ws: WebSocket, inputUrl: string, outputFormat: string, options: any) {
  if (!inputUrl) {
    ws.send(JSON.stringify({ type: "error", error: "inputUrl is required" }));
    return;
  }

  const jobId = `ws_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const processor = new VideoProcessor();

  ws.send(JSON.stringify({ type: "job_created", jobId, status: "processing" }));

  // Subscribe to job updates
  JobManager.subscribe(jobId, (job) => {
    ws.send(JSON.stringify({
      type: "job_update",
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      outputUrl: job.outputUrl,
    }));
  });

  try {
    await processor.process(jobId, inputUrl, outputFormat || "hls", options || {});
    ws.send(JSON.stringify({ type: "job_completed", jobId }));
  } catch (error: any) {
    ws.send(JSON.stringify({ type: "job_failed", jobId, error: error.message }));
  }
}

function handleStatusRequest(ws: WebSocket, jobId: string) {
  const job = JobManager.getJob(jobId);
  if (!job) {
    ws.send(JSON.stringify({ type: "error", error: "Job not found" }));
    return;
  }

  ws.send(JSON.stringify({
    type: "job_status",
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    outputUrl: job.outputUrl,
  }));
}

function handleSubscribeRequest(ws: WebSocket, jobId: string) {
  JobManager.subscribe(jobId, (job) => {
    ws.send(JSON.stringify({
      type: "job_update",
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      outputUrl: job.outputUrl,
    }));
  });
  ws.send(JSON.stringify({ type: "subscribed", jobId }));
}
