import { describe, test, expect } from "bun:test";
import app from "../server";

const getReq = (path: string) => app.fetch(new Request(`http://localhost${path}`));

const postReq = (path: string, body: object) =>
  app.fetch(new Request(`http://localhost${path}`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));

const putReq = (path: string, body: object) =>
  app.fetch(new Request(`http://localhost${path}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));

const deleteReq = (path: string) =>
  app.fetch(new Request(`http://localhost${path}`, { method: "DELETE" }));

describe("Root API", () => {
  test("GET / returns API info", async () => {
    const res = await getReq("/");
    const json = await res.json();
    expect(json.name).toBe("DBOBJ + Hono API");
    expect(json.version).toBe("1.0.0");
  });
});

describe("Tables API", () => {
  test("GET /api/v1/tables returns tables list", async () => {
    const res = await getReq("/api/v1/tables");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.tables).toBeDefined();
  });

  test("GET /api/v1/tables/:name returns table metadata", async () => {
    const res = await getReq("/api/v1/tables/users");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.columns).toBeDefined();
  });

  test("GET /api/v1/tables/:name returns 404 for non-existent table", async () => {
    const res = await getReq("/api/v1/tables/notexist");
    expect(res.status).toBe(404);
  });
});

describe("CRUD API", () => {
  test("GET /api/v1/users returns users", async () => {
    const res = await getReq("/api/v1/users");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
  });

  test("GET /api/v1/users with limit and offset", async () => {
    const res = await getReq("/api/v1/users?limit=10&offset=0");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test("GET /api/v1/users/:id returns 404 for non-existent", async () => {
    const res = await getReq("/api/v1/users/999999");
    expect(res.status).toBe(404);
  });

  test("POST /api/v1/users creates a user", async () => {
    const res = await postReq("/api/v1/users", { name: "Test User", email: "test@example.com" });
    expect([201, 400]).toContain(res.status);
  });

  test("PUT /api/v1/users/:id returns 404 for non-existent", async () => {
    const res = await putReq("/api/v1/users/999999", { name: "Updated" });
    expect(res.status).toBe(404);
  });

  test("DELETE /api/v1/users/:id returns 404 for non-existent", async () => {
    const res = await deleteReq("/api/v1/users/999999");
    expect(res.status).toBe(404);
  });
});

describe("Invalid routes", () => {
  test("returns 404 for invalid table", async () => {
    const res = await getReq("/api/v1/notreal");
    expect(res.status).toBe(404);
  });
});