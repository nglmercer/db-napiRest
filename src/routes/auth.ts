import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { scryptHash, scryptCompare, create, verify } from "webtoken-rs";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const TOKEN_EXPIRY = 3600;

const authRouter = new Hono();

authRouter.post("/register", async (c) => {
  const body = await c.req.json<{
    email?: string;
    password?: string;
    name?: string;
    age?: number;
  }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const existing = db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .get();
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const hashedPassword = await scryptHash(body.password, 4);
  const now = new Date().toISOString();

  const result = db
    .insert(users)
    .values({
      name: body.name || "User",
      email: body.email,
      password: hashedPassword,
      age: body.age ?? null,
      active: true,
      created_at: now,
    })
    .returning()
    .get();

  const token = create(
    { sub: String(result.id), email: result.email },
    AUTH_SECRET,
    TOKEN_EXPIRY,
  );

  return c.json(
    {
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        active: result.active,
        created_at: result.created_at,
      },
      token,
    },
    201,
  );
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const user = db.select().from(users).where(eq(users.email, body.email)).get();
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await scryptCompare(body.password, user.password);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = create(
    { sub: String(user.id), email: user.email },
    AUTH_SECRET,
    TOKEN_EXPIRY,
  );

  const { password: _pw, ...safeUser } = user;
  return c.json({ user: safeUser, token });
});

authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, AUTH_SECRET);
    const userId = Number(payload.sub);

    const user = db.select().from(users).where(eq(users.id, userId)).get();
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
