import { Hono } from "hono";
import { sqlite } from "../db";
import { getValidTables, findSchema, getRowById, deleteRow, getNextId, getAllRows, getTableColumns } from "../utils/db";

const crudRouter = new Hono();

crudRouter.get("/:table", (c) => {
  const table = c.req.param("table");
  const validTables = getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const limit = Number(c.req.query("limit") || "100");
  const offset = Number(c.req.query("offset") || "0");
  const data = getAllRows(table, limit, offset);
  return c.json({ data });
});

crudRouter.get("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = parseInt(c.req.param("id") || "0");
  const validTables = getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const data = getRowById(table, id);
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data });
});

crudRouter.post("/:table", async (c) => {
  const table = c.req.param("table");
  const validTables = getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const body = await c.req.json<Record<string, unknown>>();
  const tableDef = findSchema(table);
  if (!tableDef) {
    return c.json({ error: "Schema not found" }, 404);
  }

  const columns = getTableColumns(table);
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

  const placeholders = Object.keys(insertData).map(() => "?").join(", ");
  const colNames = Object.keys(insertData).map((c) => `"${c}"`).join(", ");
  const values = Object.values(insertData);

  try {
    const result = sqlite.run(
      `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`,
      values as (string | number | boolean | null)[]
    );

    const row = getRowById(table, Number(result.lastInsertRowid));
    return c.json({ data: row }, 201);
  } catch (e) {
    return c.json({ error: "Insert failed", detail: String(e) }, 400);
  }
});

crudRouter.put("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  const validTables = getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const existing = getRowById(table, parseInt(id));
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json<Record<string, unknown>>();
  const columns = getTableColumns(table);

  const updateCols = columns.filter((col) => col !== "id" && col in body);
  if (updateCols.length === 0) {
    return c.json({ error: "No valid columns provided" }, 400);
  }

  const setClauses = updateCols.map((col) => `"${col}" = ?`).join(", ");
  const values = updateCols.map((col) => body[col]);

  sqlite.run(
    `UPDATE "${table}" SET ${setClauses} WHERE id = ?`,
    [...values, parseInt(id)] as (string | number | boolean | null)[]
  );

  const row = getRowById(table, parseInt(id));
  return c.json({ data: row });
});

crudRouter.delete("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = parseInt(c.req.param("id") || "0");
  const validTables = getValidTables();
  if (!validTables.has(table)) {
    return c.json({ error: "Table not found" }, 404);
  }

  const existing = getRowById(table, id);
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  deleteRow(table, id);
  return c.json({ ok: true });
});

export default crudRouter;
