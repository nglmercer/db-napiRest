import { type TableSchema, DataType } from "../schema";

export const ordersSchema: TableSchema = {
  name: "orders",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "user_id", dataType: DataType.Integer },
    { name: "total", dataType: DataType.Float },
    { name: "status", dataType: DataType.String },
    { name: "created_at", dataType: DataType.String },
  ],
};