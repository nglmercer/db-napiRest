import type { TableSchema } from "../schema";

export const orderItemsSchema: TableSchema = {
  name: "order_items",
  columns: [
    { name: "id", type: "integer" },
    { name: "order_id", type: "integer" },
    { name: "product_id", type: "integer" },
    { name: "quantity", type: "integer" },
    { name: "unit_price", type: "float" },
  ],
};