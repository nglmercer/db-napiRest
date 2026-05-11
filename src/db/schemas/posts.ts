import { type TableSchema, DataType } from "../schema";

export const postsSchema: TableSchema = {
  name: "posts",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "user_id", dataType: DataType.Integer },
    { name: "title", dataType: DataType.String },
    { name: "content", dataType: DataType.String },
    { name: "published", dataType: DataType.Boolean },
    { name: "created_at", dataType: DataType.String },
    { name: "updated_at", dataType: DataType.String },
  ],
};