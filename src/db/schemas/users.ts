import { type TableSchema, DataType } from "../schema";

export const usersSchema: TableSchema = {
  name: "users",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "email", dataType: DataType.String },
    { name: "password", dataType: DataType.String },
    { name: "age", dataType: DataType.Integer },
    { name: "active", dataType: DataType.Boolean },
    { name: "created_at", dataType: DataType.String },
  ],
};