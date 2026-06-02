import { Router } from "napi-router/adapter/router";
import { Validator } from "napi-router";
import { s, validate } from "napi-router/adapter/router/validator";
import { client } from "../db";
import { verify } from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const validator = new Validator();

function requireAuth(c: any): number | null {
  const authHeader = c.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = verify(authHeader.slice(7), AUTH_SECRET);
    return Number(payload.sub);
  } catch {
    return null;
  }
}

const socialRouter = new Router();

socialRouter.post("/reels/:reelId/like", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  const existing = await client.execute({
    sql: `SELECT id FROM likes WHERE user_id = ? AND reel_id = ?`,
    args: [userId, reelId],
  });

  if (existing.rows.length > 0) {
    return c.json({ error: "Already liked" }, 409);
  }

  await client.execute({
    sql: `INSERT INTO likes (user_id, reel_id, created_at) VALUES (?, ?, datetime('now'))`,
    args: [userId, reelId],
  });

  await client.execute({
    sql: `UPDATE reels SET likes_count = likes_count + 1 WHERE id = ?`,
    args: [reelId],
  });

  const result = await client.execute({
    sql: `SELECT likes_count FROM reels WHERE id = ?`,
    args: [reelId],
  });

  return c.json({ liked: true, likes_count: (result.rows[0] as any).likes_count });
});

socialRouter.delete("/reels/:reelId/like", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  await client.execute({
    sql: `DELETE FROM likes WHERE user_id = ? AND reel_id = ?`,
    args: [userId, reelId],
  });

  await client.execute({
    sql: `UPDATE reels SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
    args: [reelId],
  });

  const result = await client.execute({
    sql: `SELECT likes_count FROM reels WHERE id = ?`,
    args: [reelId],
  });

  return c.json({ liked: false, likes_count: (result.rows[0] as any).likes_count });
});

socialRouter.get("/reels/:reelId/comments", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  const limit = c.req.queryParam("limit").int(50) || 50;
  const offset = c.req.queryParam("offset").int(0) || 0;

  const result = await client.execute({
    sql: `
      SELECT rc.*, u.name as user_name, u.email as user_email
      FROM reel_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE rc.reel_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [reelId, limit, offset],
  });

  return c.json({ data: result.rows, hasMore: result.rows.length === limit });
});

socialRouter.post("/reels/:reelId/comments", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  const bodyraw = await c.req.json();
  const bodyresult = validate(bodyraw, { content: s.string().required().min(1).max(500) }, validator);
  if (!bodyresult.success) return c.json({ error: bodyresult.errors }, 400);

  const result = await client.execute({
    sql: `INSERT INTO reel_comments (reel_id, user_id, content, created_at) VALUES (?, ?, ?, datetime('now'))`,
    args: [reelId, userId, bodyresult.data.content],
  });

  await client.execute({
    sql: `UPDATE reels SET comments_count = comments_count + 1 WHERE id = ?`,
    args: [reelId],
  });

  const comment = await client.execute({
    sql: `
      SELECT rc.*, u.name as user_name, u.email as user_email
      FROM reel_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE rc.id = ?
    `,
    args: [Number(result.lastInsertRowid)],
  });

  return c.json({ data: comment.rows[0] }, 201);
});

socialRouter.delete("/comments/:commentId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const commentId = c.req.pathParam("commentId").int(0);
  if (!commentId) return c.json({ error: "Invalid comment ID" }, 400);

  const existing = await client.execute({
    sql: `SELECT reel_id, user_id FROM reel_comments WHERE id = ?`,
    args: [commentId],
  });

  if (existing.rows.length === 0) return c.json({ error: "Not found" }, 404);
  const comment = existing.rows[0] as any;
  if (comment.user_id !== userId) return c.json({ error: "Forbidden" }, 403);

  await client.execute({
    sql: `DELETE FROM reel_comments WHERE id = ?`,
    args: [commentId],
  });

  await client.execute({
    sql: `UPDATE reels SET comments_count = MAX(0, comments_count - 1) WHERE id = ?`,
    args: [comment.reel_id],
  });

  return c.json({ ok: true });
});

socialRouter.post("/users/:userId/follow", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const targetUserId = c.req.pathParam("userId").int(0);
  if (!targetUserId) return c.json({ error: "Invalid user ID" }, 400);
  if (userId === targetUserId) return c.json({ error: "Cannot follow yourself" }, 400);

  const existing = await client.execute({
    sql: `SELECT id FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [userId, targetUserId],
  });

  if (existing.rows.length > 0) {
    return c.json({ error: "Already following" }, 409);
  }

  await client.execute({
    sql: `INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, datetime('now'))`,
    args: [userId, targetUserId],
  });

  return c.json({ following: true });
});

socialRouter.delete("/users/:userId/follow", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const targetUserId = c.req.pathParam("userId").int(0);
  if (!targetUserId) return c.json({ error: "Invalid user ID" }, 400);

  await client.execute({
    sql: `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
    args: [userId, targetUserId],
  });

  return c.json({ following: false });
});

socialRouter.post("/reels/:reelId/share", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  await client.execute({
    sql: `UPDATE reels SET shares_count = shares_count + 1 WHERE id = ?`,
    args: [reelId],
  });

  const result = await client.execute({
    sql: `SELECT shares_count FROM reels WHERE id = ?`,
    args: [reelId],
  });

  return c.json({ shares_count: (result.rows[0] as any).shares_count });
});

export default socialRouter;
