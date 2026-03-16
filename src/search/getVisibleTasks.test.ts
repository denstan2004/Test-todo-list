import { describe, it, expect } from "vitest";
import { getVisibleTasks } from "./getVisibleTasks";
import type { Column, Task } from "../types";

function makeTasks(
  ...items: { id: string; name: string; completed: boolean }[]
): Record<string, Task> {
  const record: Record<string, Task> = {};
  for (const t of items) {
    record[t.id] = t;
  }
  return record;
}

const tasks = makeTasks(
  { id: "t1", name: "Buy groceries", completed: false },
  { id: "t2", name: "Write tests", completed: true },
  { id: "t3", name: "Deploy app", completed: false },
  { id: "t4", name: "Review PR", completed: true },
);

const column: Column = {
  id: "c1",
  title: "Todo",
  taskIds: ["t1", "t2", "t3", "t4"],
};

describe("getVisibleTasks", () => {
  it("returns all tasks when filter is 'all' and no search query", () => {
    const results = getVisibleTasks(column, tasks, "all", "");
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.taskId)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(results.every((r) => r.matchType === "exact" && r.score === 0)).toBe(
      true,
    );
  });

  it("returns only completed tasks when filter is 'completed'", () => {
    const results = getVisibleTasks(column, tasks, "completed", "");
    expect(results.map((r) => r.taskId)).toEqual(["t2", "t4"]);
  });

  it("returns only incomplete tasks when filter is 'incomplete'", () => {
    const results = getVisibleTasks(column, tasks, "incomplete", "");
    expect(results.map((r) => r.taskId)).toEqual(["t1", "t3"]);
  });

  it("applies search on filtered tasks", () => {
    const results = getVisibleTasks(column, tasks, "all", "deploy");
    expect(results).toHaveLength(1);
    expect(results[0].taskId).toBe("t3");
    expect(results[0].matchType).toBe("exact");
  });

  it("applies filter before search", () => {
    // "Write tests" is completed — searching for "write" with incomplete filter should exclude it
    const results = getVisibleTasks(column, tasks, "incomplete", "write");
    expect(results.every((r) => r.taskId !== "t2")).toBe(true);
  });

  it("skips missing task IDs gracefully", () => {
    const col: Column = {
      id: "c2",
      title: "X",
      taskIds: ["t1", "missing", "t3"],
    };
    const results = getVisibleTasks(col, tasks, "all", "");
    expect(results.map((r) => r.taskId)).toEqual(["t1", "t3"]);
  });

  it("returns empty array when no tasks match filter", () => {
    const allIncomplete = makeTasks({
      id: "a",
      name: "Task A",
      completed: false,
    });
    const col: Column = { id: "c", title: "C", taskIds: ["a"] };
    const results = getVisibleTasks(col, allIncomplete, "completed", "");
    expect(results).toEqual([]);
  });

  it("returns exact matches before fuzzy matches", () => {
    const t = makeTasks(
      { id: "x1", name: "testing", completed: false },
      { id: "x2", name: "tset", completed: false }, // fuzzy match for "test"
    );
    const col: Column = { id: "c", title: "C", taskIds: ["x1", "x2"] };
    const results = getVisibleTasks(col, t, "all", "test");
    const exactResults = results.filter((r) => r.matchType === "exact");
    const fuzzyResults = results.filter((r) => r.matchType === "fuzzy");
    // All exact matches should come before fuzzy matches
    if (exactResults.length > 0 && fuzzyResults.length > 0) {
      const lastExactIdx = results.lastIndexOf(
        exactResults[exactResults.length - 1],
      );
      const firstFuzzyIdx = results.indexOf(fuzzyResults[0]);
      expect(lastExactIdx).toBeLessThan(firstFuzzyIdx);
    }
  });
});
