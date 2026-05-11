import type { TableSchema } from "../schema";

export const postsSchema: TableSchema = {
  name: "posts",
  columns: [
    { name: "id", type: "integer" },
    { name: "user_id", type: "integer" },
    { name: "title", type: "string" },
    { name: "content", type: "string" },
    { name: "published", type: "boolean" },
    { name: "created_at", type: "string" },
    { name: "updated_at", type: "string" },
  ],
};