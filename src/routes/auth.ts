import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "your-32-character-secret-key-1234"
);
const TOKEN_EXPIRY = "1h";

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, "bcrypt");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

async function createToken(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(AUTH_SECRET);
}

async function verifyToken(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, AUTH_SECRET);
  return payload as Record<string, unknown>;
}

const authRouter = new Hono();

authRouter.post("/register", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; name?: string; age?: number }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const existing = db.select().from(users).where(eq(users.email, body.email)).get();
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const hashedPassword = await hashPassword(body.password);
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

  const token = await createToken({ sub: String(result.id), email: result.email });

  return c.json(
    {
      user: { id: result.id, name: result.name, email: result.email, active: result.active, created_at: result.created_at },
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

  const isValid = await verifyPassword(body.password, user.password);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await createToken({ sub: String(user.id), email: user.email });

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
    const payload = await verifyToken(token);
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
