import { db, sqlite } from "../db";
import * as schema from "../db/schema";
import { eq, sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export function getValidTables(): Set<string> {
  const tables = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  return new Set(tables.map((t) => t.name));
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

export function getTableMetadata(tableName: string): { rowCount: number; columns: string[] } | null {
  const table = findSchema(tableName);
  if (!table) return null;

  const columns = Object.keys(table).filter((key) => !key.startsWith("_"));
  const countResult = sqlite
    .query(`SELECT COUNT(*) as count FROM "${tableName}"`)
    .get() as { count: number };
  return { rowCount: countResult.count, columns };
}

export function getTableColumns(tableName: string): string[] {
  const result = sqlite.query(`PRAGMA table_info("${tableName}")`).all() as { name: string }[];
  return result.map((r) => r.name);
}

export function getAllRows(tableName: string, limit = 100, offset = 0): unknown[] {
  const rows = sqlite
    .query(`SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`)
    .all();
  return rows as unknown[];
}

export function getRowById(tableName: string, id: number): unknown | null {
  const row = sqlite
    .query(`SELECT * FROM "${tableName}" WHERE id = ?`)
    .get(id);
  return row || null;
}

export function deleteRow(tableName: string, id: number): void {
  sqlite.run(`DELETE FROM "${tableName}" WHERE id = ?`, [id]);
}

export function getNextId(tableName: string): number {
  const result = sqlite
    .query(`SELECT MAX(id) as maxId FROM "${tableName}"`)
    .get() as { maxId: number | null };
  return (result.maxId ?? 0) + 1;
}
