import { Hono } from "hono";
import { hash, compare, create, verify } from "webtoken-rs";
import { db } from "../db";
import { getNextId } from "../utils/db";
const AUTH_SECRET = process.env.AUTH_SECRET || "your-32-character-secret-key-1234";
const TOKEN_EXPIRY = 3600;

const authRouter = new Hono();

authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password, name, age } = body;

  if (!email || !password || !age || !name) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const existing = db.executeSql(`SELECT id FROM users WHERE email = '${email}'`);
  if (Array.isArray(existing) && existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }
  const nextId = getNextId('users');
  const hashedPassword = await hash(password);

  const now = new Date().toISOString();
  /**
   * 
   export const usersSchema: TableSchema = {
     name: "users",
     columns: [
       { name: "id", dataType: DataType.Integer },
       { name: "name", dataType: DataType.String },
       { name: "email", dataType: DataType.String },
       { name: "password", dataType: DataType.String },
       { name: "age", dataType: DataType.Integer },
       { name: "active", dataType: DataType.Boolean },
       { name: "created_at", dataType: DataType.String },
     ],
   };
   */
  db.insertRow('users', [nextId, name || "User", email, hashedPassword, age, true, now])

  const token = create({ sub: String(nextId), email }, AUTH_SECRET, TOKEN_EXPIRY);

  return c.json({
    user: { id: nextId, name: name || "User", email, hashedPassword, age, active: true, created_at: now },
    token,
  }, 201);
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const result = db.executeSql(`SELECT id, email, password, name, active, created_at FROM users WHERE email = '${email}'`);
  if (!Array.isArray(result) || result.length === 0) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const user = result[0];
  const isValid = await compare(password, user.password);
  if (!isValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = create({ sub: String(user.id), email: user.email }, AUTH_SECRET, TOKEN_EXPIRY);

  return c.json({ user: { ...user, password: undefined }, token });
});

authRouter.get("/me", (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, AUTH_SECRET);
    const userId = payload.sub;

    const result = db.executeSql(`SELECT id, name, email, age, active, created_at FROM users WHERE id = ${userId}`);
    if (!Array.isArray(result) || result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: result[0] });
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export default authRouter;