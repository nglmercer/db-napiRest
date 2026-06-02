import { Router } from "napi-router/adapter/router";
import { client } from "../db";
import { verify } from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";

function getUserId(c: any): number | null {
  const authHeader = c.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = verify(authHeader.slice(7), AUTH_SECRET);
    return Number(payload.sub);
  } catch {
    return null;
  }
}

const feedRouter = new Router();

feedRouter.get("/", async (c) => {
  const userId = getUserId(c);
  const limit = c.req.queryParam("limit").int(20) || 20;
  const offset = c.req.queryParam("offset").int(0) || 0;

  const result = await client.execute({
    sql: `
      SELECT r.*,
        u.name as user_name,
        u.email as user_email,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE reel_id = r.id AND user_id = ${userId}) > 0` : "0"} as is_liked,
        ${userId ? `(SELECT COUNT(*) FROM follows WHERE follower_id = ${userId} AND following_id = r.user_id) > 0` : "0"} as is_following
      FROM reels r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [limit, offset],
  });

  return c.json({ data: result.rows, hasMore: result.rows.length === limit });
});

feedRouter.get("/trending", async (c) => {
  const userId = getUserId(c);
  const limit = c.req.queryParam("limit").int(20) || 20;

  const result = await client.execute({
    sql: `
      SELECT r.*,
        u.name as user_name,
        u.email as user_email,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE reel_id = r.id AND user_id = ${userId}) > 0` : "0"} as is_liked,
        ${userId ? `(SELECT COUNT(*) FROM follows WHERE follower_id = ${userId} AND following_id = r.user_id) > 0` : "0"} as is_following
      FROM reels r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.likes_count DESC, r.views DESC
      LIMIT ?
    `,
    args: [limit],
  });

  return c.json({ data: result.rows });
});

feedRouter.get("/user/:userId", async (c) => {
  const profileUserId = c.req.pathParam("userId").int(0);
  if (!profileUserId) return c.json({ error: "Invalid user ID" }, 400);

  const currentUserId = getUserId(c);
  const limit = c.req.queryParam("limit").int(20) || 20;
  const offset = c.req.queryParam("offset").int(0) || 0;

  const userResult = await client.execute({
    sql: `SELECT id, name, email, created_at FROM users WHERE id = ?`,
    args: [profileUserId],
  });

  if (userResult.rows.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  const user = userResult.rows[0];

  const reelsResult = await client.execute({
    sql: `
      SELECT r.*,
        u.name as user_name,
        u.email as user_email,
        ${currentUserId ? `(SELECT COUNT(*) FROM likes WHERE reel_id = r.id AND user_id = ${currentUserId}) > 0` : "0"} as is_liked,
        ${currentUserId ? `(SELECT COUNT(*) FROM follows WHERE follower_id = ${currentUserId} AND following_id = r.user_id) > 0` : "0"} as is_following
      FROM reels r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [profileUserId, limit, offset],
  });

  const followersCount = await client.execute({
    sql: `SELECT COUNT(*) as c FROM follows WHERE following_id = ?`,
    args: [profileUserId],
  });

  const followingCount = await client.execute({
    sql: `SELECT COUNT(*) as c FROM follows WHERE follower_id = ?`,
    args: [profileUserId],
  });

  const isFollowing = currentUserId
    ? await client.execute({
        sql: `SELECT COUNT(*) as c FROM follows WHERE follower_id = ? AND following_id = ?`,
        args: [currentUserId, profileUserId],
      })
    : { rows: [{ c: 0 }] };

  return c.json({
    user: {
      ...user,
      followers_count: Number((followersCount.rows[0] as any).c),
      following_count: Number((followingCount.rows[0] as any).c),
      is_following: Number((isFollowing.rows[0] as any).c) > 0,
    },
    data: reelsResult.rows,
    hasMore: reelsResult.rows.length === limit,
  });
});

feedRouter.post("/view/:reelId", async (c) => {
  const reelId = c.req.pathParam("reelId").int(0);
  if (!reelId) return c.json({ error: "Invalid reel ID" }, 400);

  await client.execute({
    sql: `UPDATE reels SET views = views + 1 WHERE id = ?`,
    args: [reelId],
  });

  return c.json({ ok: true });
});

feedRouter.get("/search", async (c) => {
  const q = c.req.queryParam("q").string() || "";
  const userId = getUserId(c);
  const limit = c.req.queryParam("limit").int(20) || 20;

  if (!q) return c.json({ data: [] });

  const result = await client.execute({
    sql: `
      SELECT r.*,
        u.name as user_name,
        u.email as user_email,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE reel_id = r.id AND user_id = ${userId}) > 0` : "0"} as is_liked,
        ${userId ? `(SELECT COUNT(*) FROM follows WHERE follower_id = ${userId} AND following_id = r.user_id) > 0` : "0"} as is_following
      FROM reels r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.title LIKE ? OR r.description LIKE ? OR r.hashtags LIKE ? OR u.name LIKE ?
      ORDER BY r.likes_count DESC, r.views DESC
      LIMIT ?
    `,
    args: [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit],
  });

  return c.json({ data: result.rows });
});

export default feedRouter;
