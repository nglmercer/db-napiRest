import { describe, test, expect } from "bun:test";
import { quoteValue, getValidTables, findSchema } from "../utils/db";

describe("quoteValue", () => {
  test("handles null", () => {
    expect(quoteValue(null, "string")).toBe("NULL");
  });

  test("handles undefined", () => {
    expect(quoteValue(undefined, "string")).toBe("NULL");
  });

  test("handles integer", () => {
    expect(quoteValue(42, "integer")).toBe("42");
  });

  test("handles float", () => {
    expect(quoteValue(3.14, "float")).toBe("3.14");
  });

  test("handles boolean true", () => {
    expect(quoteValue(true, "boolean")).toBe("TRUE");
  });

  test("handles boolean false", () => {
    expect(quoteValue(false, "boolean")).toBe("FALSE");
  });

  test("handles string", () => {
    expect(quoteValue("hello", "string")).toBe("'hello'");
  });

  test("escapes single quotes in strings", () => {
    expect(quoteValue("it's", "string")).toBe("'it''s'");
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