import { describe, test, expect } from "bun:test";
import app from "../server";

const getReq = (path: string, token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return app.fetch(new Request(`http://localhost${path}`, { headers }));
};

const postReq = (path: string, body: object) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }));

const json = async <T>(res: Response) => res.json() as Promise<T>;

describe("Auth API", () => {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "testpassword123";

  test("POST /api/v1/auth/register creates a user", async () => {
    const res = await postReq("/api/v1/auth/register", {
      email: testEmail,
      password: testPassword,
      name: "Test User",
    });
    const data = await json<{ user: unknown; token: string }>(res);
    expect(res.status).toBe(201);
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
  });

  test("POST /api/v1/auth/register returns 409 for duplicate email", async () => {
    const res = await postReq("/api/v1/auth/register", {
      email: testEmail,
      password: "different",
    });
    expect(res.status).toBe(409);
  });

  test("POST /api/v1/auth/register returns 400 for missing email/password", async () => {
    const res = await postReq("/api/v1/auth/register", { name: "Test" });
    expect(res.status).toBe(400);
  });

  test("POST /api/v1/auth/login succeeds with valid credentials", async () => {
    const res = await postReq("/api/v1/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    const data = await json<{ user: unknown; token: string }>(res);
    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
  });

  test("POST /api/v1/auth/login returns 401 for invalid password", async () => {
    const res = await postReq("/api/v1/auth/login", {
      email: testEmail,
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/auth/login returns 401 for non-existent user", async () => {
    const res = await postReq("/api/v1/auth/login", {
      email: "nonexistent@example.com",
      password: "password",
    });
    expect(res.status).toBe(401);
  });

  test("GET /api/v1/auth/me returns user with valid token", async () => {
    const loginRes = await postReq("/api/v1/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    const loginData = await json<{ token: string }>(loginRes);
    const token = loginData.token;

    const res = await getReq("/api/v1/auth/me", token);
    const data = await json<{ user: unknown }>(res);
    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
  });

  test("GET /api/v1/auth/me returns 401 without token", async () => {
    const res = await getReq("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/v1/auth/me returns 401 with invalid token", async () => {
    const res = await getReq("/api/v1/auth/me", "invalid-token");
    expect(res.status).toBe(401);
  });
});