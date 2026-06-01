import { Router } from "napi-router/adapter/router";
import { Validator } from "napi-router";
import { client, initDatabase } from "./db";
import { v1Router } from "./routes";
import { existsSync, statSync } from "node:fs";
import { getTableMetadata } from "./utils/db";

await initDatabase();

const validator = new Validator();
const serverRouter = new Router();

serverRouter.cors("*", "/", {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

serverRouter.mount("/api/v1", v1Router);

serverRouter.get("/", async (c) => {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );

  const tables = await Promise.all(
    result.rows.map(async ({ name }) => {
      const meta = await getTableMetadata(name as string);
      return { name, ...meta };
    }),
  );

  return c.json({
    name: "Drizzle + Turso SQLite API",
    version: "1.0.0",
    tables,
  });
});

const staticDir = "./web/dist";
if (existsSync(staticDir) && statSync(staticDir).isDirectory()) {
  serverRouter.static("/", staticDir, "index.html");
}

export default serverRouter;
