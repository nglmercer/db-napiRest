import { type TableSchema, DataType } from "../schema";

export const sessionsSchema: TableSchema = {
  name: "sessions",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "user_id", dataType: DataType.Integer },
    { name: "token", dataType: DataType.String },
    { name: "expires_at", dataType: DataType.String },
    { name: "created_at", dataType: DataType.String },
  ],
};