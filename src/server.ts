import { Router } from "napi-router/adapter/router";
import { Validator } from "napi-router";
import { sqlite, initDatabase } from "./db";
import { v1Router } from "./routes";
import { existsSync, statSync } from "node:fs";
import { getTableMetadata } from "./utils/db";

initDatabase();

const validator = new Validator();
const serverRouter = new Router();

serverRouter.cors("*", "/", {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

serverRouter.mount("/api/v1", v1Router);

serverRouter.get("/", (c) => {
  const tables = sqlite
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
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
  serverRouter.static("/", staticDir, "index.html");
}

export default serverRouter;
