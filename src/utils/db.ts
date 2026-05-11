import { db } from "../db";
import { schemas, DataType } from "../db/schema";


export function quoteValue(val: unknown, dataType: number): string {
  if (val === null || val === undefined) return "NULL";
  if (dataType === DataType.Integer || dataType === DataType.Float) return String(val);
  if (dataType === DataType.Boolean) return val ? "TRUE" : "FALSE";
  // Escape single quotes by doubling them (SQL standard escape)
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function getValidTables(): Set<string> {
  return new Set(schemas.map((s) => s.name));
}

export function findSchema(tableName: string) {
  return schemas.find((s) => s.name === tableName);
}

export function getNextId(table: string): number {
  const meta = db.getTableMetadata(table);
  if (meta) return meta.rowCount + 1;
  return 1;
}

export function tableGetById(table: string, id: number): unknown | null {
  const result = db.executeSql(`SELECT * FROM ${table} WHERE id = ${id}`);
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

export function getColumnMax(table: string, col: string): number {
  try {
    const vals = db.getColumnI64(table, col);
    if (vals.length === 0) return 0;
    let max = vals[0]!;
    for (let i = 1; i < vals.length; i++) {
      if (vals[i]! > max) max = vals[i]!;
    }
    return Number(max);
  } catch {
    return 0;
  }
}

export function bulkInsertI64(
  table: string,
  rows: number[][],
  numCols: number,
): void {
  const batch = new BigInt64Array(rows.length * numCols);
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < numCols; j++) {
      batch[i * numCols + j] = BigInt(rows[i]![j]!);
    }
  }
  db.insertBatchI64(table, batch, numCols);
}
