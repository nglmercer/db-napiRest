import { db, client } from "../db";
import * as schema from "../db/schema";
import { eq, sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export async function getValidTables(): Promise<Set<string>> {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  return new Set(result.rows.map((r) => r.name as string));
}

export function findSchema(tableName: string): SQLiteTable | undefined {
  const schemaMap: Record<string, SQLiteTable> = {
    users: schema.users,
    products: schema.products,
    categories: schema.categories,
    orders: schema.orders,
    order_items: schema.orderItems,
    posts: schema.posts,
    comments: schema.comments,
    tags: schema.tags,
    post_tags: schema.postTags,
    sessions: schema.sessions,
    reels: schema.reels,
  };
  return schemaMap[tableName];
}

export async function getTableMetadata(
  tableName: string,
): Promise<{ rowCount: number; columns: string[] } | null> {
  const table = findSchema(tableName);
  if (!table) return null;

  const columns = Object.keys(table).filter((key) => !key.startsWith("_"));
  const countResult = await client.execute(
    `SELECT COUNT(*) as count FROM "${tableName}"`,
  );
  const count = countResult.rows[0]?.count as number;
  return { rowCount: count, columns };
}

export async function getTableColumns(tableName: string): Promise<string[]> {
  const result = await client.execute(`PRAGMA table_info("${tableName}")`);
  return result.rows.map((r) => r.name as string);
}

export async function getAllRows(
  tableName: string,
  limit = 100,
  offset = 0,
): Promise<unknown[]> {
  const result = await client.execute(
    `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`,
  );
  return result.rows as unknown[];
}

export async function getRowById(
  tableName: string,
  id: number,
): Promise<unknown | null> {
  const result = await client.execute({
    sql: `SELECT * FROM "${tableName}" WHERE id = ?`,
    args: [id],
  });
  return result.rows[0] || null;
}

export async function deleteRow(tableName: string, id: number): Promise<void> {
  await client.execute({
    sql: `DELETE FROM "${tableName}" WHERE id = ?`,
    args: [id],
  });
}

export async function getNextId(tableName: string): Promise<number> {
  const result = await client.execute(
    `SELECT MAX(id) as maxId FROM "${tableName}"`,
  );
  const maxId = result.rows[0]?.maxId as number | null;
  return (maxId ?? 0) + 1;
}
