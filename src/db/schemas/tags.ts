import { type TableSchema, DataType } from "../schema";

export const tagsSchema: TableSchema = {
  name: "tags",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "name", dataType: DataType.String },
    { name: "slug", dataType: DataType.String },
  ],
};