import type { Database, ColumnDefinition } from "dbobj-napi";
import { DataType } from "dbobj-napi";

export { DataType };
export type { ColumnDefinition };
export type TableSchema = {
  name: string;
  columns: ColumnDefinition[];
};

import {
  usersSchema,
  productsSchema,
  categoriesSchema,
  ordersSchema,
  orderItemsSchema,
  postsSchema,
  commentsSchema,
  tagsSchema,
  postTagsSchema,
  sessionsSchema,
  reelsSchema,
} from "./schemas";

export const schemas: TableSchema[] = [
  usersSchema,
  productsSchema,
  categoriesSchema,
  ordersSchema,
  orderItemsSchema,
  postsSchema,
  commentsSchema,
  tagsSchema,
  postTagsSchema,
  sessionsSchema,
  reelsSchema,
];

export function initSchema(db: Database): void {
  const existingTables = new Set(db.listTables());

  for (const schema of schemas) {
    if (existingTables.has(schema.name)) continue;

    db.createTable(schema.name, schema.columns);
    console.log(`Created table: ${schema.name}`);
  }

  for (const schema of schemas) {
    const colNames = schema.columns.map((c) => c.name);
    for (const col of schema.columns) {
      if (col.name !== "id") {
        db.createIndex(schema.name, col.name);
      }
    }

    for (const col of schema.columns) {
      if (["email", "slug", "token"].includes(col.name)) {
        db.createUniqueIndex(schema.name, col.name);
      }
    }
  }
}
