import { Router } from "napi-router/adapter/router";
import { Validator } from "napi-router";
import { s, validate } from "napi-router/adapter/router/validator";
import { client } from "../db";
import {
  getValidTables,
  findSchema,
  getRowById,
  deleteRow,
  getNextId,
  getAllRows,
  getTableColumns,
} from "../utils/db";

const validator = new Validator();
const crudRouter = new Router();

crudRouter.get("/:table", async (c) => {
  const table = c.req.pathParam("table").require("table");
  
  // Skip reserved route names
  const reservedRoutes = new Set(["feed", "social", "upload", "auth", "reels", "tables", "video"]);
  if (reservedRoutes.has(table)) {
    return c.json({ error: "Not found" }, 404);
  }
  
  const validTables = await getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const limit = c.req.queryParam("limit").int(100)!;
  const offset = c.req.queryParam("offset").int(0)!;
  const data = await getAllRows(table, limit, offset);
  return c.json({ data });
});

crudRouter.get("/:table/:id", async (c) => {
  const table = c.req.pathParam("table").require("table");
  const id = c.req.pathParam("id").int(0)!;
  const validTables = await getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const data = await getRowById(table, id);
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data });
});

crudRouter.post("/:table", async (c) => {
  const table = c.req.pathParam("table").require("table");
  const validTables = await getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const bodyraw = await c.req.json();
  const bodyresult = validate(
    bodyraw,
    {
      data: s.object({
        name: s.string().required(),
        email: s.string().required().pattern("email"),
        price: s.number(),
        description: s.string(),
        stock: s.integer(),
        title: s.string().required(),
        content: s.string(),
        video_url: s.string(),
        thumbnail_url: s.string(),
      }),
    },
    validator,
  );

  const body = (bodyresult.success ? bodyresult.data : bodyraw) as Record<string, unknown>;
  const tableDef = findSchema(table);
  if (!tableDef) {
    return c.json({ error: "Schema not found" }, 404);
  }

  const columns = await getTableColumns(table);
  const insertData: Record<string, unknown> = {};

  for (const col of columns) {
    if (col === "id") continue;
    if (col in body) {
      insertData[col] = body[col];
    }
  }

  if (Object.keys(insertData).length === 0) {
    return c.json({ error: "No valid columns provided" }, 400);
  }

  const now = new Date().toISOString();
  if ("created_at" in tableDef && !("created_at" in insertData)) {
    insertData.created_at = now;
  }

  const placeholders = Object.keys(insertData)
    .map(() => "?")
    .join(", ");
  const colNames = Object.keys(insertData)
    .map((c) => `"${c}"`)
    .join(", ");
  const values = Object.values(insertData);

  try {
    const result = await client.execute({
      sql: `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`,
      args: values as (string | number | boolean | null | bigint)[],
    });

    const row = await getRowById(table, Number(result.lastInsertRowid));
    return c.json({ data: row }, 201);
  } catch (e) {
    return c.json({ error: "Insert failed", detail: String(e) }, 400);
  }
});

crudRouter.put("/:table/:id", async (c) => {
  const table = c.req.pathParam("table").require("table");
  const id = c.req.pathParam("id").require("id");
  const validTables = await getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const existing = await getRowById(table, parseInt(id));
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = (await c.req.json()) as Record<string, unknown>;
  const columns = await getTableColumns(table);

  const updateCols = columns.filter((col) => col !== "id" && col in body);
  if (updateCols.length === 0) {
    return c.json({ error: "No valid columns provided" }, 400);
  }

  const setClauses = updateCols.map((col) => `"${col}" = ?`).join(", ");
  const values = updateCols.map((col) => body[col]);

  await client.execute({
    sql: `UPDATE "${table}" SET ${setClauses} WHERE id = ?`,
    args: [...values, parseInt(id)] as (string | number | boolean | null | bigint)[],
  });

  const row = await getRowById(table, parseInt(id));
  return c.json({ data: row });
});

crudRouter.delete("/:table/:id", async (c) => {
  const table = c.req.pathParam("table").require("table");
  const id = c.req.pathParam("id").int(0)!;
  const validTables = await getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const existing = await getRowById(table, id);
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await deleteRow(table, id);
  return c.json({ ok: true });
});

export default crudRouter;
