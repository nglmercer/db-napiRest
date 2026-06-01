import { Hono } from "hono";
import { cors } from "hono/cors";
import { sqlite, initDatabase } from "./db";
import { v1Router } from "./routes";
import { existsSync, statSync } from "node:fs";
import { getTableMetadata } from "./utils/db";
import { serveStatic } from "hono/bun";

initDatabase();

const app = new Hono();

app.use("*", cors());

app.route("/api/v1", v1Router);

app.get("/", (c) => {
  const tables = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  const result = tables.map(({ name }) => {
    const meta = getTableMetadata(name);
    return { name, ...meta };
  });

  return c.json({
    name: "Drizzle + Bun SQLite API",
    version: "1.0.0",
    tables: result,
  });
});

const staticDir = "./web/dist";
if (existsSync(staticDir) && statSync(staticDir).isDirectory()) {
  app.use("/assets/*", serveStatic({ root: "./web/dist" }));
  app.get("/*", serveStatic({ root: "./web/dist", path: "index.html" }));
}

export default app;
