import { type TableSchema, DataType } from "../schema";

export const orderItemsSchema: TableSchema = {
  name: "order_items",
  columns: [
    { name: "id", dataType: DataType.Integer },
    { name: "order_id", dataType: DataType.Integer },
    { name: "product_id", dataType: DataType.Integer },
    { name: "quantity", dataType: DataType.Integer },
    { name: "unit_price", dataType: DataType.Float },
  ],
};