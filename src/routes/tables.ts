import { Hono } from "hono";
import { db } from "../db";
import { schemas } from "../db/schema";

const tablesRouter = new Hono();

tablesRouter.get("/", (c) => {
  const tables = db.listTables().map((name) => {
    const meta = db.getTableMetadata(name);
    return { name, ...meta };
  });
  return c.json({ tables });
});

tablesRouter.get("/:name", (c) => {
  const name = c.req.param("name");
  const meta = db.getTableMetadata(name);
  if (!meta) return c.json({ error: "Table not found" }, 404);

  const schema = schemas.find((s) => s.name === name);
  return c.json({ ...meta, columns: schema?.columns ?? [] });
});

export default tablesRouter;