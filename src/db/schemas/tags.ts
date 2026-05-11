import type { TableSchema } from "../schema";

export const tagsSchema: TableSchema = {
  name: "tags",
  columns: [
    { name: "id", type: "integer" },
    { name: "name", type: "string" },
    { name: "slug", type: "string" },
  ],
};