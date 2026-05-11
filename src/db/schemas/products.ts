import { type TableSchema, DataType } from "../schema";

export const productsSchema: TableSchema = {
  name: "products",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "description", dataType: DataType.String },
    { name: "price", dataType: DataType.Float },
    { name: "stock", dataType: DataType.Integer },
    { name: "category_id", dataType: DataType.Integer },
    { name: "active", dataType: DataType.Boolean },
    { name: "created_at", dataType: DataType.String },
  ],
};