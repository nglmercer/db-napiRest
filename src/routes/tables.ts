import { Router } from "napi-router/adapter/router";
import { sqlite } from "../db";
import { getTableMetadata, getTableColumns } from "../utils/db";

const tablesRouter = new Router();

tablesRouter.get("/", (c) => {
  const tables = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  const result = tables.map(({ name }) => {
    const meta = getTableMetadata(name);
    return { name, ...meta };
  });
  return c.json({ tables: result });
});

tablesRouter.get("/:name", (c) => {
  const name = c.req.pathParam("name").require("name");
  const meta = getTableMetadata(name);
  if (!meta) {
    return c.json({ error: "Table not found" }, 404);
  }

  const columns = getTableColumns(name);
  return c.json({ ...meta, columns });
});

export default tablesRouter;
