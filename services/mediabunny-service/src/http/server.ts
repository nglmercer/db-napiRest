import { Hono } from "hono";
import { cors } from "hono/cors";
import { processVideoHandler } from "./handlers/process.js";
import { hlsStreamHandler } from "./handlers/hls.js";
import { statusHandler } from "./handlers/status.js";

export const app = new Hono();

// Middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "mediabunny-service" }));

// Video processing endpoints
app.post("/process", processVideoHandler);
app.get("/hls/:jobId/:filename", hlsStreamHandler);
app.get("/status/:jobId", statusHandler);

// Error handling
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: err.message }, 500);
});
