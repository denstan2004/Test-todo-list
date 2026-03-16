import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { searchTasks } from "./searchEngine";
import type { Task } from "../types";

describe("searchTasks property tests", () => {
  /**
   * Property 4: Exact substring matches always appear before fuzzy matches in results
   * Validates: Requirements 12.2
   */
  it("exact substring matches always appear before fuzzy matches in results", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            completed: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc
          .string({ minLength: 2, maxLength: 5 })
          .filter((s) => s.trim().length >= 2),
        (tasks: Task[], query: string) => {
          const results = searchTasks(tasks, query);

          // Ordering invariant: for all i < j, if results[i] is fuzzy then results[j] must also be fuzzy
          // (no exact match can come after a fuzzy match)
          for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
              if (results[i].matchType === "fuzzy") {
                expect(results[j].matchType).toBe("fuzzy");
              }
            }
          }

          // Score invariant: all exact matches have score=0, all fuzzy matches have score > 0
          for (const result of results) {
            if (result.matchType === "exact") {
              expect(result.score).toBe(0);
            } else {
              expect(result.score).toBeGreaterThan(0);
            }
          }
        },
      ),
    );
  });
});
