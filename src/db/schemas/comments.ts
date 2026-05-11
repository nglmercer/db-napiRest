import { type TableSchema, DataType } from "../schema";

export const commentsSchema: TableSchema = {
  name: "comments",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "post_id", dataType: DataType.Integer },
    { name: "user_id", dataType: DataType.Integer },
    { name: "content", dataType: DataType.String },
    { name: "created_at", dataType: DataType.String },
  ],
};