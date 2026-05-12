import { Hono } from "hono";
import { hash, compare, create, verify } from "webtoken-rs";
import { db } from "../db";
import { getColumnMax } from "../utils/db";

const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const TOKEN_EXPIRY = 3600;

const authRouter = new Hono();

/**
 * Build a user object from column arrays for a given row index.
 * getRows() and executeSql() both return interned string placeholders —
 * getColumnString/getColumnI64/getColumnBool are the only APIs that return
 * actual deserialized values from dbobj-napi.
 */
function buildUserAtIndex(idx: number): Record<string, unknown> {
  const ids = db.getColumnI64("users", "id");
  const names = db.getColumnString("users", "name");
  const emails = db.getColumnString("users", "email");
  const passwords = db.getColumnString("users", "password");
  const ages = db.getColumnI64("users", "age");
  const actives = db.getColumnBool("users", "active");
  const dates = db.getColumnString("users", "created_at");
  return {
    id: Number(ids[idx]),
    name: names[idx],
    email: emails[idx],
    password: passwords[idx],
    age: Number(ages[idx]),
    active: actives[idx],
    created_at: dates[idx],
  };
}

function getUserByEmail(email: string): Record<string, unknown> | null {
  // findByString returns row indices (positions), not ID values
  const indices = db.findByString("users", "email", email);
  if (!indices || indices.length === 0) return null;
  return buildUserAtIndex(Number(indices[0]));
}

function getUserById(id: number): Record<string, unknown> | null {
  // findByI64 returns row indices (positions), not ID values
  const indices = db.findByI64("users", "id", id);
  if (!indices || indices.length === 0) return null;
  return buildUserAtIndex(Number(indices[0]));
}

authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password, name, age } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

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
  const nextId = db.maxColumn("users", "id") + 1;
  const hashedPassword = await hash(password);
  const now = new Date().toISOString();

  // Column order: id, name, email, password, age, active, created_at
  db.insertRow("users", [nextId, name || "User", email, hashedPassword, age ?? null, true, now]);

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

  const isValid = await compare(password, user.password as string);
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
