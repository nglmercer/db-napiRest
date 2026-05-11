import { Hono } from "hono";
import { db } from "../db";
import { getValidTables, findSchema, quoteValue, getNextId, tableGetById } from "../utils/db";

const crudRouter = new Hono();

crudRouter.get("/:table", (c) => {
  const table = c.req.param("table");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const limit = Number(c.req.query("limit") || "100");
  const offset = Number(c.req.query("offset") || "0");
  const result = db.getRows(table, offset, limit);
  const data = result;
  return c.json({ data });
});

crudRouter.get("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = parseInt(c.req.param("id"));
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const data = tableGetById(table, id);
  if (!data) return c.json({ error: "Not found" }, 404);
  return c.json({ data });
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
  //this table has 7 columns and insertRow receive not same quantity of columns
  //db.insertRow(table, [...values]);
  console.log(columns, values)
  db.executeSql(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")})`
  );

  const row = tableGetById(table, nextId);
  return c.json({ data: row }, 201);
});

crudRouter.put("/:table/:id", async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const ids = db.findByI64(table, "id", parseInt(id));
  if (ids.length === 0) return c.json({ error: "Not found" }, 404);

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

  const row = tableGetById(table, parseInt(id));
  return c.json({ data: row });
});

crudRouter.delete("/:table/:id", (c) => {
  const table = c.req.param("table");
  const id = parseInt(c.req.param("id"));
  const validTables = getValidTables();
  if (!validTables.has(table)) return c.json({ error: "Table not found" }, 404);

  const ids = db.findByI64(table, "id", id);
  if (ids.length === 0) return c.json({ error: "Not found" }, 404);

  db.deleteRow(table, id);
  return c.json({ ok: true });
});

export default crudRouter;