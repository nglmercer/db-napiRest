import { Router } from "napi-router/adapter/router";
import { client } from "../db";
import { verify } from "jsonwebtoken";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";

const uploadRouter = new Router();

uploadRouter.post("/video", async (c) => {
  const authHeader = c.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let userId: number;
  try {
    const payload = verify(authHeader.slice(7), AUTH_SECRET);
    userId = Number(payload.sub);
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  const contentType = c.req.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    const body = await c.req.json() as any;
    if (!body.title || !body.video_url) {
      return c.json({ error: "title and video_url are required" }, 400);
    }

    const result = await client.execute({
      sql: `INSERT INTO reels (user_id, title, description, video_url, thumbnail_url, music, hashtags, views, likes_count, comments_count, shares_count, processing_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'pending', datetime('now'))`,
      args: [
        userId,
        body.title,
        body.description || null,
        body.video_url,
        body.thumbnail_url || null,
        body.music || null,
        body.hashtags || null,
      ],
    });

    const reelId = Number(result.lastInsertRowid);

    // Auto-procesar video con mediabunny-service
    try {
      const MEDIABUNNY_URL = process.env.MEDIABUNNY_URL || "http://localhost:3002";
      const processResponse = await fetch(`${MEDIABUNNY_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrl: body.video_url,
          outputFormat: "hls",
          options: {
            segmentDuration: 6,
            playlistSize: 10,
          },
        }),
      });

      if (processResponse.ok) {
        const jobData = await processResponse.json() as { jobId: string };
        await client.execute({
          sql: `UPDATE reels SET processing_job_id = ?, processing_status = 'processing' WHERE id = ?`,
          args: [jobData.jobId, reelId],
        });
      }
    } catch (error) {
      console.error("Failed to auto-process video:", error);
      // No fallar el upload si el procesamiento falla
    }

    const reel = await client.execute({
      sql: `SELECT r.*, u.name as user_name, u.email as user_email FROM reels r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      args: [reelId],
    });

    return c.json({ data: reel.rows[0] }, 201);
  }

  if (contentType.includes("multipart/form-data")) {
    const uploadsDir = join(process.cwd(), "uploads");
    mkdirSync(uploadsDir, { recursive: true });

    const rawRequest = (c.req as any).raw || c.req;
    const formData = await rawRequest.formData();
    const file = formData.get("video") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const music = formData.get("music") as string;
    const hashtags = formData.get("hashtags") as string;

    if (!file || !title) {
      return c.json({ error: "video file and title are required" }, 400);
    }

    const ext = file.name.split(".").pop() || "mp4";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filepath, buffer);

    const videoUrl = `/uploads/${filename}`;

    const result = await client.execute({
      sql: `INSERT INTO reels (user_id, title, description, video_url, thumbnail_url, music, hashtags, views, likes_count, comments_count, shares_count, created_at)
            VALUES (?, ?, ?, ?, NULL, ?, ?, 0, 0, 0, 0, datetime('now'))`,
      args: [userId, title, description || null, videoUrl, music || null, hashtags || null],
    });

    const reel = await client.execute({
      sql: `SELECT r.*, u.name as user_name, u.email as user_email FROM reels r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      args: [Number(result.lastInsertRowid)],
    });

    return c.json({ data: reel.rows[0] }, 201);
  }

  return c.json({ error: "Unsupported content type" }, 400);
});

export default uploadRouter;
