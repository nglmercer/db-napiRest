import { Context } from "hono";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { config } from "../../../config/index.js";

export async function hlsStreamHandler(c: Context) {
  try {
    const jobId = c.req.param("jobId");
    const filename = c.req.param("filename");

    if (!jobId || !filename) {
      return c.json({ error: "jobId and filename are required" }, 400);
    }

    const filePath = join(config.outputDir, jobId, filename);

    if (!existsSync(filePath)) {
      return c.json({ error: "File not found" }, 404);
    }

    const fileBuffer = await readFile(filePath);
    const contentType = filename.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : filename.endsWith(".ts")
      ? "video/mp2t"
      : "application/octet-stream";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("HLS stream error:", error);
    return c.json({ error: "Failed to stream HLS content" }, 500);
  }
}
