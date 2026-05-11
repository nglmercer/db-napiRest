import type { TableSchema } from "../schema";

export const sessionsSchema: TableSchema = {
  name: "sessions",
  columns: [
    { name: "id", type: "integer" },
    { name: "user_id", type: "integer" },
    { name: "token", type: "string" },
    { name: "expires_at", type: "string" },
    { name: "created_at", type: "string" },
  ],
};