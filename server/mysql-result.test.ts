import { describe, expect, it } from "vitest";
import { getMySqlInsertId } from "../shared/mysql";

describe("getMySqlInsertId", () => {
  it("reads mysql2 insert headers returned directly or in an array", () => {
    expect(getMySqlInsertId({ insertId: 42 })).toBe(42);
    expect(getMySqlInsertId([{ insertId: 43 }, undefined])).toBe(43);
  });

  it("does not convert missing or invalid identifiers into usable payment IDs", () => {
    expect(getMySqlInsertId({})).toBeNull();
    expect(getMySqlInsertId([{ insertId: 0 }])).toBeNull();
    expect(getMySqlInsertId([{ insertId: "NaN" }])).toBeNull();
  });
});
