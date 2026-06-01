import { Router } from "napi-router/adapter/router";
import { client } from "../db";
import { getTableMetadata, getTableColumns } from "../utils/db";

const tablesRouter = new Router();

tablesRouter.get("/", async (c) => {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );

  const tables = await Promise.all(
    result.rows.map(async ({ name }) => {
      const meta = await getTableMetadata(name as string);
      return { name, ...meta };
    }),
  );

  return c.json({ tables });
});

tablesRouter.get("/:name", async (c) => {
  const name = c.req.pathParam("name").require("name");
  const meta = await getTableMetadata(name);
  if (!meta) {
    return c.json({ error: "Table not found" }, 404);
  }

  const columns = await getTableColumns(name);
  return c.json({ ...meta, columns });
});

export default tablesRouter;
