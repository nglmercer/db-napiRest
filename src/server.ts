import { Hono } from "hono";
import { db } from "./db";
import { v1Router } from "./routes";

const app = new Hono();

app.route("/api/v1", v1Router);

app.get("/", (c) => {
  const tables = db.listTables().map((t) => ({ name: t, ...db.getTableMetadata(t) }));
  return c.json({
    name: "DBOBJ + Hono API",
    version: "1.0.0",
    tables,
  });
});

export default app;

if (import.meta.main) {
  const port = parseInt(process.env.PORT || "3001");
  const server = Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`Server running on port ${server.port}`);
}