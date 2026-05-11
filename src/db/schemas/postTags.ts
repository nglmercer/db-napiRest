import { type TableSchema, DataType } from "../schema";

export const postTagsSchema: TableSchema = {
  name: "post_tags",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "post_id", dataType: DataType.Integer },
    { name: "tag_id", dataType: DataType.Integer },
  ],
};