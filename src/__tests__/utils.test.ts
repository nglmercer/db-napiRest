import { describe, test, expect } from "bun:test";
import { quoteValue, getValidTables, findSchema } from "../utils/db";
import { DataType } from "../db/schema";

describe("quoteValue", () => {
  test("handles null", () => {
    expect(quoteValue(null, DataType.String)).toBe("NULL");
  });

  test("handles undefined", () => {
    expect(quoteValue(undefined, DataType.String)).toBe("NULL");
  });

  test("handles integer", () => {
    expect(quoteValue(42, DataType.Integer)).toBe("42");
  });

  test("handles float", () => {
    expect(quoteValue(3.14, DataType.Float)).toBe("3.14");
  });

  test("handles boolean true", () => {
    expect(quoteValue(true, DataType.Boolean)).toBe("TRUE");
  });

  test("handles boolean false", () => {
    expect(quoteValue(false, DataType.Boolean)).toBe("FALSE");
  });

  test("handles string", () => {
    expect(quoteValue("hello", DataType.String)).toBe("'hello'");
  });

  test("escapes single quotes in strings", () => {
    expect(quoteValue("it's", DataType.String)).toBe("'it''s'");
  });
});

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
    expect(schema?.name).toBe("users");
  });

  test("returns undefined for non-existent table", () => {
    const schema = findSchema("notreal");
    expect(schema).toBeUndefined();
  });
});