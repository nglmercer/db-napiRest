import { Router } from "napi-router/adapter/router";
import { Validator } from "napi-router";
import { s, validate } from "napi-router/adapter/router/validator";
import { db, client } from "../db";
import { reels } from "../db/schema";
import { eq } from "drizzle-orm";
import { verify } from "webtoken-rs";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const validator = new Validator();

function verifyToken(token: string): Record<string, unknown> {
  return verify(token, AUTH_SECRET) as Record<string, unknown>;
}

const reelsRouter = new Router();

reelsRouter.use("*", "/", async (c) => {
  const authHeader = c.req.headers.get("Authorization");
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
});

reelsRouter.get("/", async (c) => {
  const userId = c.get<number>("userId");
  const data = await db.select().from(reels).where(eq(reels.user_id, userId)).all();
  return c.json({ data });
});

reelsRouter.get("/:id", async (c) => {
  const id = c.req.pathParam("id").int(0)!;
  const data = await db.select().from(reels).where(eq(reels.id, id)).get();
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data });
});

reelsRouter.post("/", async (c) => {
  const userId = c.get<number>("userId");
  const bodyraw = await c.req.json();

  const bodyresult = validate(
    bodyraw,
    {
      title: s.string().required(),
      video_url: s.string().required(),
      description: s.string(),
      thumbnail_url: s.string(),
    },
    validator,
  );

  if (!bodyresult.success) {
    return c.json({ error: bodyresult.errors }, 400);
  }

  const body = bodyresult.data;

  const now = new Date().toISOString();

  const result = await db
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
  const id = c.req.pathParam("id").int(0)!;
  const userId = c.get<number>("userId");
  const body = (await c.req.json()) as Record<string, unknown>;

  const existing = await db.select().from(reels).where(eq(reels.id, id)).get();
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
  const result = await client.execute({
    sql: `UPDATE "reels" SET ${Object.keys(updateData)
      .map((k) => `"${k}" = ?`)
      .join(", ")} WHERE id = ? RETURNING *`,
    args: [...values, id] as (string | number | boolean | null | bigint)[],
  });

  return c.json({ data: result.rows[0] });
});

reelsRouter.delete("/:id", async (c) => {
  const id = c.req.pathParam("id").int(0)!;
  const userId = c.get<number>("userId");

  const existing = await db.select().from(reels).where(eq(reels.id, id)).get();
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }
  if (existing.user_id !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await client.execute({
    sql: `DELETE FROM "reels" WHERE id = ?`,
    args: [id],
  });
  return c.json({ ok: true });
});

export default reelsRouter;
