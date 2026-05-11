import type { Database } from "dbobj-napi";

export interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
}

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
];

export function initSchema(db: Database): void {
  const existingTables = new Set(db.listTables());

  for (const schema of schemas) {
    if (existingTables.has(schema.name)) continue;

    const colNames = schema.columns.map((c) => c.name);
    const colTypes = schema.columns.map((c) => c.type);
    db.createTable(schema.name, colNames, colTypes);
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
