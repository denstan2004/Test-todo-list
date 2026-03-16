import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { boardReducer, createDefaultState } from "./boardReducer";

describe("boardReducer property tests", () => {
  /**
   * Property 1: Adding then removing a task yields original column task list
   * Validates: Requirements 1.1, 2.1
   */
  it("adding then removing a task yields original column task list", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (taskName) => {
          // Start with a state that has one column
          const columnId = "col-1";
          const initialState = {
            ...createDefaultState(),
            columns: {
              [columnId]: { id: columnId, title: "Todo", taskIds: [] },
            },
            columnOrder: [columnId],
          };

          const originalTaskIds = [...initialState.columns[columnId].taskIds];

          // Add a task
          const stateAfterAdd = boardReducer(initialState, {
            type: "ADD_TASK",
            columnId,
            taskName,
          });

          // Find the newly added task ID
          const newTaskId = stateAfterAdd.columns[columnId].taskIds.find(
            (id) => !originalTaskIds.includes(id),
          );
          expect(newTaskId).toBeDefined();

          // Remove the task
          const stateAfterRemove = boardReducer(stateAfterAdd, {
            type: "REMOVE_TASK",
            taskId: newTaskId!,
          });

          // The column's taskIds should be back to original
          expect(stateAfterRemove.columns[columnId].taskIds).toEqual(
            originalTaskIds,
          );
          expect(stateAfterRemove.columns[columnId].taskIds.length).toBe(
            originalTaskIds.length,
          );
        },
      ),
    );
  });

  /**
   * Property 2: Reordering a task to its current position does not change state
   * Validates: Requirements 7.1
   */
  it("reordering a task to its current position does not change state", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 5 },
        ),
        fc.nat(),
        (taskNames, pickSeed) => {
          const columnId = "col-1";
          const initialState = createDefaultState();
          initialState.columns[columnId] = {
            id: columnId,
            title: "Todo",
            taskIds: [],
          };
          initialState.columnOrder = [columnId];
          let state = initialState;

          // Add tasks to the column
          for (const name of taskNames) {
            state = boardReducer(state, {
              type: "ADD_TASK",
              columnId,
              taskName: name,
            });
          }

          const taskIds = [...state.columns[columnId].taskIds];
          // Pick a random task from the column
          const taskIndex = pickSeed % taskIds.length;
          const taskId = taskIds[taskIndex];

          // Dispatch REORDER_TASK with the task's current index
          const result = boardReducer(state, {
            type: "REORDER_TASK",
            columnId,
            taskId,
            newIndex: taskIndex,
          });

          // The taskIds array should be identical
          expect(result.columns[columnId].taskIds).toEqual(taskIds);
        },
      ),
    );
  });
});
