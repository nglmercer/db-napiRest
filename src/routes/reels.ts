import { Hono } from "hono";
import { db, sqlite } from "../db";
import { reels } from "../db/schema";
import { eq } from "drizzle-orm";
import { verify } from "webtoken-rs";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "your-32-character-secret-key-1234";

function verifyToken(token: string): Record<string, unknown> {
  return verify(token, AUTH_SECRET) as Record<string, unknown>;
}

type Variables = {
  userId: number;
};

const reelsRouter = new Hono<{ Variables: Variables }>();

reelsRouter.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    c.set("userId", Number(payload.sub));
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  await next();
});

reelsRouter.get("/", (c) => {
  const userId = c.get("userId");
  const data = db.select().from(reels).where(eq(reels.user_id, userId)).all();
  return c.json({ data });
});

reelsRouter.get("/:id", (c) => {
  const id = parseInt(c.req.param("id") || "0");
  const data = db.select().from(reels).where(eq(reels.id, id)).get();
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data });
});

reelsRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    title?: string;
    description?: string;
    video_url?: string;
    thumbnail_url?: string;
  }>();

  if (!body.title || !body.video_url) {
    return c.json({ error: "Title and video_url are required" }, 400);
  }

  const now = new Date().toISOString();

  const result = db
    .insert(reels)
    .values({
      user_id: userId,
      title: body.title,
      description: body.description || null,
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url || null,
      views: 0,
      created_at: now,
    })
    .returning()
    .get();

  return c.json({ data: result }, 201);
});

reelsRouter.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id") || "0");
  const userId = c.get("userId");
  const body = await c.req.json<Record<string, unknown>>();

  const existing = db.select().from(reels).where(eq(reels.id, id)).get();
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }
  if (existing.user_id !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const { id: _id, user_id: _uid, created_at: _ca, ...updateData } = body;

  if (Object.keys(updateData).length === 0) {
    return c.json({ data: existing });
  }

  const values = Object.values(updateData);
  const result = sqlite
    .query(
      `UPDATE "reels" SET ${Object.keys(updateData)
        .map((k) => `"${k}" = ?`)
        .join(", ")} WHERE id = ? RETURNING *`,
    )
    .get(...(values as (string | number | boolean | null)[]), id);

  return c.json({ data: result });
});

reelsRouter.delete("/:id", (c) => {
  const id = parseInt(c.req.param("id") || "0");
  const userId = c.get("userId");

  const existing = db.select().from(reels).where(eq(reels.id, id)).get();
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }
  if (existing.user_id !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  sqlite.run(`DELETE FROM "reels" WHERE id = ?`, [id]);
  return c.json({ ok: true });
});

export default reelsRouter;
