import type { TableSchema } from "../schema";

export const ordersSchema: TableSchema = {
  name: "orders",
  columns: [
    { name: "id", type: "integer" },
    { name: "user_id", type: "integer" },
    { name: "total", type: "float" },
    { name: "status", type: "string" },
    { name: "created_at", type: "string" },
  ],
};