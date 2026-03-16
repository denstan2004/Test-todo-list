import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { saveBoardState, loadBoardState } from "./persistence";
import type { BoardState, Task, Column } from "../types";

describe("persistence property tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Property 3: Serializing then deserializing a valid BoardState produces an equivalent state
   * Validates: Requirements 13.4
   */
  it("serializing then deserializing a valid BoardState produces an equivalent state", () => {
    const arbBoardState: fc.Arbitrary<BoardState> = fc
      .record({
        numTasks: fc.integer({ min: 0, max: 3 }),
        numColumns: fc.integer({ min: 1, max: 3 }),
        taskData: fc.array(
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            completed: fc.boolean(),
          }),
          { minLength: 3, maxLength: 3 },
        ),
      })
      .chain(({ numTasks, numColumns, taskData }) => {
        const tasks: Record<string, Task> = {};
        const taskIds: string[] = [];

        for (let i = 0; i < numTasks; i++) {
          const id = `task-${i}`;
          tasks[id] = {
            id,
            name: taskData[i].name,
            completed: taskData[i].completed,
          };
          taskIds.push(id);
        }

        // Distribute tasks across columns
        return fc
          .shuffledSubarray(taskIds, {
            minLength: taskIds.length,
            maxLength: taskIds.length,
          })
          .map((shuffledTaskIds) => {
            const columns: Record<string, Column> = {};
            const columnOrder: string[] = [];

            for (let c = 0; c < numColumns; c++) {
              const colId = `col-${c}`;
              columns[colId] = { id: colId, title: `Column ${c}`, taskIds: [] };
              columnOrder.push(colId);
            }

            // Assign each task to exactly one column (round-robin)
            shuffledTaskIds.forEach((taskId, idx) => {
              const colIdx = idx % numColumns;
              columns[`col-${colIdx}`].taskIds.push(taskId);
            });

            const state: BoardState = {
              columns,
              columnOrder,
              tasks,
              selectedTaskIds: new Set<string>(),
              searchQuery: "",
              filter: "all",
            };
            return state;
          });
      });

    fc.assert(
      fc.property(arbBoardState, (originalState) => {
        saveBoardState(originalState);
        const loadedState = loadBoardState();

        // Persisted fields should be deeply equal
        expect(loadedState.columns).toEqual(originalState.columns);
        expect(loadedState.columnOrder).toEqual(originalState.columnOrder);
        expect(loadedState.tasks).toEqual(originalState.tasks);

        // Transient fields should be reset to defaults
        expect(loadedState.selectedTaskIds).toEqual(new Set());
        expect(loadedState.searchQuery).toBe("");
        expect(loadedState.filter).toBe("all");
      }),
    );
  });
});
