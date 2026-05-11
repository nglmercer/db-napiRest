import { type TableSchema, DataType } from "../schema";

export const categoriesSchema: TableSchema = {
  name: "categories",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "slug", dataType: DataType.String },
    { name: "description", dataType: DataType.String },
  ],
};