import type { TableSchema } from "../schema";

export const categoriesSchema: TableSchema = {
  name: "categories",
  columns: [
    { name: "id", type: "integer" },
    { name: "name", type: "string" },
    { name: "slug", type: "string" },
    { name: "description", type: "string" },
  ],
};