import { describe, test, expect } from "bun:test";
import { getValidTables, findSchema, getTableColumns, getRowById, getNextId } from "../utils/db";

describe("getValidTables", () => {
  test("returns set of valid table names", () => {
    const tables = getValidTables();
    expect(tables.has("users")).toBe(true);
    expect(tables.has("products")).toBe(true);
    expect(tables.has("notreal")).toBe(false);
  });
});

describe("findSchema", () => {
  test("finds schema by name", () => {
    const schema = findSchema("users");
    expect(schema).toBeDefined();
  });

  test("returns undefined for non-existent table", () => {
    const schema = findSchema("notreal");
    expect(schema).toBeUndefined();
  });
});

describe("getTableColumns", () => {
  test("returns columns for a table", () => {
    const columns = getTableColumns("users");
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("email");
  });
});

describe("getRowById", () => {
  test("returns null for non-existent row", () => {
    const row = getRowById("users", 999999);
    expect(row).toBeNull();
  });
});

describe("getNextId", () => {
  test("returns 1 for empty table", () => {
    const id = getNextId("users");
    expect(id).toBeGreaterThanOrEqual(1);
  });
});
