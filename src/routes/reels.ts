import { Hono } from "hono";
import { verify } from "webtoken-rs";
import { db } from "../db";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";

function authMiddleware(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.json({ error: "No token provided" }, 401);

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, AUTH_SECRET);
    c.set("userId" as any, Number(payload.sub));
    return next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

const reelsRouter = new Hono();

reelsRouter.use("/*", authMiddleware);

reelsRouter.get("/", (c) => {
  const userId = (c as any).get("userId") as number;

  const result = db.executeSql(`SELECT * FROM reels WHERE user_id = ${userId}`);
  const data = Array.isArray(result) ? result : [];
  return c.json({ data });
});

reelsRouter.get("/:id", (c) => {
  const id = parseInt(c.req.param("id"));
  const result = db.executeSql(`SELECT * FROM reels WHERE id = ${id}`);
  const data = Array.isArray(result) && result.length > 0 ? result[0] : null;
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ data });
});

reelsRouter.post("/", async (c) => {
  const userId = (c as any).get("userId") as number;
  const body = await c.req.json();
  const { title, description, video_url, thumbnail_url } = body;

  if (!title || !video_url) {
    return c.json({ error: "Title and video_url are required" }, 400);
  }

  const nextId = (db.maxColumn("reels", "id") ?? 0) + 1;
  const now = new Date().toISOString();

  const columns = ["id", "user_id", "title", "description", "video_url", "thumbnail_url", "views", "created_at"];
  const values = `${nextId}, ${userId}, '${String(title).replace(/'/g, "''")}', '${String(description || "").replace(/'/g, "''")}', '${String(video_url).replace(/'/g, "''")}', '${String(thumbnail_url || "").replace(/'/g, "''")}', 0, '${now}'`;

  db.executeSql(`INSERT INTO reels (${columns.join(", ")}) VALUES (${values})`);

  const row = db.executeSql(`SELECT * FROM reels WHERE id = ${nextId}`);
  return c.json({ data: Array.isArray(row) ? row[0] : row }, 201);
});

reelsRouter.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const userId = (c as any).get("userId") as number;
  const body = await c.req.json();

  const existing = db.executeSql(`SELECT * FROM reels WHERE id = ${id}`);
  const reel = Array.isArray(existing) && existing.length > 0 ? existing[0] as Record<string, unknown> : null;
  if (!reel) return c.json({ error: "Not found" }, 404);
  if (reel && reel.user_id !== userId) return c.json({ error: "Forbidden" }, 403);

  const setClauses = Object.entries(body)
    .filter(([key]) => !["id", "user_id", "created_at"].includes(key))
    .map(([key, val]) => {
      if (typeof val === "number") return `${key} = ${val}`;
      return `${key} = '${String(val).replace(/'/g, "''")}'`;
    })
    .join(", ");

  if (setClauses) db.executeSql(`UPDATE reels SET ${setClauses} WHERE id = ${id}`);

  const updated = db.executeSql(`SELECT * FROM reels WHERE id = ${id}`);
  return c.json({ data: Array.isArray(updated) ? updated[0] : updated });
});

reelsRouter.delete("/:id", (c) => {
  const id = parseInt(c.req.param("id"));
  const userId = (c as any).get("userId") as number;

  const existing = db.executeSql(`SELECT * FROM reels WHERE id = ${id}`);
  const reel = Array.isArray(existing) && existing.length > 0 ? existing[0] as Record<string, unknown> : null;
  if (!reel) return c.json({ error: "Not found" }, 404);
  if (reel && reel.user_id !== userId) return c.json({ error: "Forbidden" }, 403);

  db.executeSql(`DELETE FROM reels WHERE id = ${id}`);
  return c.json({ ok: true });
});

export default reelsRouter;
