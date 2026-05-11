import { Hono } from "hono";
import { db } from "../db";
import { getValidTables, findSchema, quoteValue, getNextId } from "../utils/db";

const crudRouter = new Hono();

crudRouter.get("/:table", (c) => {
  const table = c.req.param("table");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  const result = db.executeSql(`SELECT * FROM ${table}`);
  const rows = Array.isArray(result) ? result.slice(offset, offset + limit) : [];
  return c.json({ data: rows });
});

crudRouter.get("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const result = db.executeSql(`SELECT * FROM ${table} WHERE id = ${id}`);
  if (!Array.isArray(result) || result.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({ data: result[0] });
});

crudRouter.post("/:table", async (c) => {
  const table = c.req.param("table");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const body = await c.req.json();
  const schema = findSchema(table);
  if (!schema) return c.json({ error: "Schema not found" }, 404);

  const nextId = body.id != null ? body.id : getNextId(table);

  const columns = [
    "id",
    ...schema.columns
      .filter((col) => col.name !== "id" && col.name in body)
      .map((col) => col.name),
  ];

  if (columns.length <= 1) {
    return c.json({ error: "No valid columns provided" }, 400);
  }

  const values = columns.map((col) => {
    if (col === "id") return String(nextId);
    const type = schema.columns.find((c) => c.name === col)!.dataType;
    return quoteValue(body[col], type);
  });

  db.executeSql(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")})`
  );

  const row = db.executeSql(`SELECT * FROM ${table} WHERE id = ${nextId}`);
  return c.json({ data: Array.isArray(row) ? row[0] : row }, 201);
});

crudRouter.put("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const existing = db.executeSql(`SELECT * FROM ${table} WHERE id = ${id}`);
  if (!Array.isArray(existing) || existing.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();
  const schema = findSchema(table);
  if (!schema) return c.json({ error: "Schema not found" }, 404);

  const columns = schema.columns
    .filter((col) => col.name !== "id" && col.name in body)
    .map((col) => col.name);

  if (columns.length === 0) {
    return c.json({ error: "No valid columns provided" }, 400);
  }

  const setClauses = columns
    .map((col) => {
      const type = schema.columns.find((c) => c.name === col)!.dataType;
      return `${col} = ${quoteValue(body[col], type)}`;
    })
    .join(", ");

  db.executeSql(`UPDATE ${table} SET ${setClauses} WHERE id = ${id}`);

  const row = db.executeSql(`SELECT * FROM ${table} WHERE id = ${id}`);
  return c.json({ data: Array.isArray(row) ? row[0] : row });
});

crudRouter.delete("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const existing = db.executeSql(`SELECT * FROM ${table} WHERE id = ${id}`);
  if (!Array.isArray(existing) || existing.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  db.executeSql(`DELETE FROM ${table} WHERE id = ${id}`);
  return c.json({ ok: true });
});

export default crudRouter;