import { db } from "../db";
import { schemas, DataType } from "../db/schema";
import type { DataType as DataTypeEnum } from "dbobj-napi";

export function quoteValue(val: unknown, dataType: DataTypeEnum): string {
  if (val === null || val === undefined) return "NULL";
  if (dataType === DataType.Integer || dataType === DataType.Float) return String(val);
  if (dataType === DataType.Boolean) return val ? "TRUE" : "FALSE";
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