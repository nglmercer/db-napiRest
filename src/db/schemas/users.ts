import type { TableSchema } from "../schema";

export const usersSchema: TableSchema = {
  name: "users",
  columns: [
    { name: "id", type: "integer" },
    { name: "name", type: "string" },
    { name: "email", type: "string" },
    { name: "age", type: "integer" },
    { name: "active", type: "boolean" },
    { name: "created_at", type: "string" },
  ],
};