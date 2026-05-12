import { type TableSchema, DataType } from "../schema";

export const reelsSchema: TableSchema = {
  name: "reels",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "user_id", dataType: DataType.Integer },
    { name: "title", dataType: DataType.String },
    { name: "description", dataType: DataType.String },
    { name: "video_url", dataType: DataType.String },
    { name: "thumbnail_url", dataType: DataType.String },
    { name: "views", dataType: DataType.Integer },
    { name: "created_at", dataType: DataType.String },
  ],
};
