import type { TableSchema } from "../schema";

export const postTagsSchema: TableSchema = {
  name: "post_tags",
  columns: [
    { name: "id", type: "integer" },
    { name: "post_id", type: "integer" },
    { name: "tag_id", type: "integer" },
  ],
};