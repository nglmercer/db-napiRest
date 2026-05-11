import type { TableSchema } from "../schema";

export const commentsSchema: TableSchema = {
  name: "comments",
  columns: [
    { name: "id", type: "integer" },
    { name: "post_id", type: "integer" },
    { name: "user_id", type: "integer" },
    { name: "content", type: "string" },
    { name: "created_at", type: "string" },
  ],
};