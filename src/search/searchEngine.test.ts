import { describe, it, expect } from "vitest";
import { searchTasks } from "./searchEngine";
import type { Task } from "../types";

function makeTasks(...names: string[]): Task[] {
  return names.map((name, i) => ({
    id: `t${i + 1}`,
    name,
    completed: false,
  }));
}

describe("searchTasks", () => {
  it("returns empty results for an empty query", () => {
    const tasks = makeTasks("Buy groceries", "Walk the dog");
    expect(searchTasks(tasks, "")).toEqual([]);
  });

  it("finds exact case-insensitive substring matches", () => {
    const tasks = makeTasks("Buy groceries", "Walk the dog");
    const results = searchTasks(tasks, "buy");

    expect(results).toHaveLength(1);
    expect(results[0].taskId).toBe("t1");
    expect(results[0].matchType).toBe("exact");
    expect(results[0].score).toBe(0);
  });

  it("finds fuzzy matches with typos", () => {
    const tasks = makeTasks("Buy groceries");
    const results = searchTasks(tasks, "grocceries");

    expect(results).toHaveLength(1);
    expect(results[0].taskId).toBe("t1");
    expect(results[0].matchType).toBe("fuzzy");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("ranks exact matches before fuzzy matches", () => {
    const tasks = makeTasks("Buy groceries", "groceries list");
    // "groceries" is an exact match for both; "grocceries" is a typo
    const results = searchTasks(tasks, "groceries");

    // Both should be exact matches here
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].matchType).toBe("exact");
    expect(results[1].matchType).toBe("exact");

    // Now test with a query that produces a mix
    const mixedTasks = makeTasks("groceries list", "Buy grocceries");
    const mixedResults = searchTasks(mixedTasks, "groceries");

    const exactResults = mixedResults.filter((r) => r.matchType === "exact");
    const fuzzyResults = mixedResults.filter((r) => r.matchType === "fuzzy");

    if (exactResults.length > 0 && fuzzyResults.length > 0) {
      const lastExactIdx = mixedResults.lastIndexOf(
        exactResults[exactResults.length - 1],
      );
      const firstFuzzyIdx = mixedResults.indexOf(fuzzyResults[0]);
      expect(lastExactIdx).toBeLessThan(firstFuzzyIdx);
    }
  });

  it("excludes tasks that do not match at all", () => {
    const tasks = makeTasks("Buy groceries", "Walk the dog", "Read a book");
    const results = searchTasks(tasks, "groceries");

    const matchedIds = results.map((r) => r.taskId);
    expect(matchedIds).toContain("t1");
    expect(matchedIds).not.toContain("t2");
    expect(matchedIds).not.toContain("t3");
  });
});
