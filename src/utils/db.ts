import { db } from "../db";
import { schemas } from "../db/schema";

export function quoteValue(val: unknown, type: string): string {
  if (val === null || val === undefined) return "NULL";
  if (type === "integer" || type === "float") return String(val);
  if (type === "boolean") return val ? "TRUE" : "FALSE";
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function getNextId(table: string): number {
  const result = db.executeSql(`SELECT id FROM ${table}`);
  if (!Array.isArray(result) || result.length === 0) return 1;
  let max = 0;
  for (const row of result) {
    if (row.id > max) max = row.id;
  }
  return max + 1;
}

export function getValidTables(): Set<string> {
  return new Set(schemas.map((s) => s.name));
}

export function findSchema(tableName: string) {
  return schemas.find((s) => s.name === tableName);
}