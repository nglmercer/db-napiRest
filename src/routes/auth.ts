import { Hono } from "hono";
import { create, verify, scryptHash, scryptCompare } from "webtoken-rs";
import { db } from "../db";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const TOKEN_EXPIRY = 3600;

const authRouter = new Hono();

function getUserByEmail(email: string): Record<string, unknown> | null {
  // findByString returns row indices (positions), not ID values
  const indices = db.findByString("users", "email", email);
  if (!indices || indices.length === 0) return null;
  const row = db.getRowById("users", Number(indices[0]));
  return row;
}

function getUserById(id: number): Record<string, unknown> | null {
  // findByI64 returns row indices (positions), not ID values
  const indices = db.findByI64("users", "id", id);
  if (!indices || indices.length === 0) return null;
  const row = db.getRowById("users", Number(indices[0]));
  return row;
}

authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password, name, age } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }
  // db.createUniqueIndex("users", "email");
  const existingIds = db.findByString("users", "email", email);
  if (existingIds && existingIds.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }
  /*
  // no data copy
    db.maxColumn("users", "age");   // → 42
    db.minColumn("users", "age");   // → 18
    db.sumColumn("users", "age");   // → 1000
    db.avgColumn("users", "age");   // → 28.5
  */
  const nextId = (db.maxColumn("users", "id") ?? 0) + 1;
  const hashedPassword = await scryptHash(password, 10);
  const now = new Date().toISOString();

  // Column order: id, name, email, password, age, active, created_at
  const resp = db.insertOrReplace(
    "users",
    [nextId, name || "User", email, hashedPassword, age ?? null, true, now],
    "email",  // unique column to match on
  );
  if (!resp) return c.json({ error: "Failed to register" }, 500);

  const token = create({ sub: String(nextId), email }, AUTH_SECRET, TOKEN_EXPIRY);

  return c.json(
    {
      user: { id: nextId, name: name || "User", email, active: true, created_at: now },
      token,
    },
    201,
  );
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const user = getUserByEmail(email);
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await scryptCompare(password, user.password as string);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = create({ sub: String(user.id), email: user.email as string }, AUTH_SECRET, TOKEN_EXPIRY);

  const { password: _pw, ...safeUser } = user;
  return c.json({ user: safeUser, token });
});

authRouter.get("/me", (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, AUTH_SECRET);
    const userId = Number(payload.sub);

    const user = getUserById(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { password: _pw, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export default authRouter;
