import { Validator } from "napi-router";
import { Router } from "napi-router/adapter/router";
import { s, validate } from "napi-router/adapter/router/validator";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { sign, verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const TOKEN_EXPIRY = 3600;
const validator = new Validator();
const authRouter = new Router();

authRouter.post("/register", async (c) => {
  const bodyraw = await c.req.json();
  const bodyresult = validate(
    bodyraw,
    {
      name: s.string().required().min(2).max(100),
      email: s.string().required().pattern("email"),
      password: s.string().required().min(6).max(100),
      age: s.integer(),
    },
    validator,
  );
  if (!bodyresult.success) {
    return c.json({ error: bodyresult.errors }, 400);
  }
  const body = bodyresult.data;
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .get();
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const now = new Date().toISOString();

  const result = await db
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

  const token = sign(
    { sub: String(result.id), email: result.email },
    AUTH_SECRET,
    { expiresIn: TOKEN_EXPIRY }
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
  const bodyraw = await c.req.json();

  const bodyresult = validate(
    bodyraw,
    {
      email: s.string().required().pattern("email"),
      password: s.string().required().min(6).max(100),
    },
    validator,
  );
  if (!bodyresult.success) {
    return c.json({ error: bodyresult.errors }, 400);
  }

  const body = bodyresult.data;
  const user = await db.select().from(users).where(eq(users.email, body.email)).get();
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isValid = await bcrypt.compare(body.password, user.password!);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = sign(
    { sub: String(user.id), email: user.email },
    AUTH_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  const { password: _pw, ...safeUser } = user;
  return c.json({ user: safeUser, token });
});

authRouter.get("/me", async (c) => {
  const authHeader = c.req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, AUTH_SECRET);
    const userId = Number(payload.sub);

    const user = await db.select().from(users).where(eq(users.id, userId)).get();
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
