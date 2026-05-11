import { Hono } from "hono";
import { db } from "./db";
import { tablesRouter, crudRouter } from "./routes";

const app = new Hono();

app.route("/api/tables", tablesRouter);
app.route("/api", crudRouter);

app.get("/", (c) => {
  const tables = db.listTables().map((t) => ({ name: t, ...db.getTableMetadata(t) }));
  return c.json({
    name: "DBOBJ + Hono API",
    version: "1.0.0",
    tables,
  });
});

export default app;