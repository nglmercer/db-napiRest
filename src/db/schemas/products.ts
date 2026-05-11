import type { TableSchema } from "../schema";

export const productsSchema: TableSchema = {
  name: "products",
  columns: [
    { name: "id", type: "integer" },
    { name: "name", type: "string" },
    { name: "description", type: "string" },
    { name: "price", type: "float" },
    { name: "stock", type: "integer" },
    { name: "category_id", type: "integer" },
    { name: "active", type: "boolean" },
    { name: "created_at", type: "string" },
  ],
};