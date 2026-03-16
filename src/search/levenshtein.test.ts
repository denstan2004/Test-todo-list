import { describe, it, expect } from "vitest";
import { levenshteinDistance } from "./levenshtein";

describe("levenshteinDistance", () => {
  it('returns 3 for "kitten" / "sitting"', () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it('returns 2 for "flaw" / "lawn"', () => {
    expect(levenshteinDistance("flaw", "lawn")).toBe(2);
  });

  it("returns the length of the other string when one is empty", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
  });

  it("returns 0 for two empty strings", () => {
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("hello", "hello")).toBe(0);
  });

  it("returns 1 for a single character substitution", () => {
    expect(levenshteinDistance("cat", "bat")).toBe(1);
  });
});
