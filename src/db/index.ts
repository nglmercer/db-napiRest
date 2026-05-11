import { Database } from "dbobj-napi";
import { initSchema } from "./schema";

const DB_PATH = process.env.DB_PATH || "app.dbobj";

let db: Database;

if (process.env.DB_PATH) {
  try {
    db = Database.load(DB_PATH);
  } catch {
    db = new Database(DB_PATH);
  }
} else {
  db = new Database(DB_PATH);
}

initSchema(db);

export { db };
