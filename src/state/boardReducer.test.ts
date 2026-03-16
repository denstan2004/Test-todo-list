import { describe, it, expect, vi } from "vitest";
import { boardReducer, createDefaultState } from "./boardReducer";
import type { BoardState } from "../types";

function stateWithColumn(columnId = "col-1", title = "Todo"): BoardState {
  return {
    ...createDefaultState(),
    columns: { [columnId]: { id: columnId, title, taskIds: [] } },
    columnOrder: [columnId],
  };
}

function stateWithTask(
  columnId = "col-1",
  taskId = "task-1",
  taskName = "My Task",
  completed = false,
): BoardState {
  return {
    ...stateWithColumn(columnId),
    tasks: { [taskId]: { id: taskId, name: taskName, completed } },
    columns: {
      [columnId]: { id: columnId, title: "Todo", taskIds: [taskId] },
    },
  };
}

describe("boardReducer", () => {
  describe("createDefaultState", () => {
    it("returns an empty board state", () => {
      const state = createDefaultState();
      expect(state.columns).toEqual({});
      expect(state.columnOrder).toEqual([]);
      expect(state.tasks).toEqual({});
      expect(state.selectedTaskIds.size).toBe(0);
      expect(state.searchQuery).toBe("");
      expect(state.filter).toBe("all");
    });
  });

  describe("ADD_TASK", () => {
    it("adds a task to the specified column", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "new-task-id" as `${string}-${string}-${string}-${string}-${string}`,
      );
      const state = stateWithColumn();
      const next = boardReducer(state, {
        type: "ADD_TASK",
        columnId: "col-1",
        taskName: "Buy milk",
      });

      expect(next.tasks["new-task-id"]).toEqual({
        id: "new-task-id",
        name: "Buy milk",
        completed: false,
      });
      expect(next.columns["col-1"].taskIds).toEqual(["new-task-id"]);
    });

    it("trims the task name", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "t1" as `${string}-${string}-${string}-${string}-${string}`,
      );
      const state = stateWithColumn();
      const next = boardReducer(state, {
        type: "ADD_TASK",
        columnId: "col-1",
        taskName: "  hello  ",
      });
      expect(next.tasks["t1"].name).toBe("hello");
    });

    it("returns unchanged state for empty task name", () => {
      const state = stateWithColumn();
      expect(
        boardReducer(state, {
          type: "ADD_TASK",
          columnId: "col-1",
          taskName: "",
        }),
      ).toBe(state);
    });

    it("returns unchanged state for whitespace-only task name", () => {
      const state = stateWithColumn();
      expect(
        boardReducer(state, {
          type: "ADD_TASK",
          columnId: "col-1",
          taskName: "   ",
        }),
      ).toBe(state);
    });

    it("returns unchanged state for non-existent column", () => {
      const state = stateWithColumn();
      expect(
        boardReducer(state, {
          type: "ADD_TASK",
          columnId: "nope",
          taskName: "test",
        }),
      ).toBe(state);
    });
  });

  describe("REMOVE_TASK", () => {
    it("removes a task from tasks and its column", () => {
      const state = stateWithTask();
      const next = boardReducer(state, {
        type: "REMOVE_TASK",
        taskId: "task-1",
      });
      expect(next.tasks["task-1"]).toBeUndefined();
      expect(next.columns["col-1"].taskIds).toEqual([]);
    });

    it("removes task from selectedTaskIds", () => {
      const state = {
        ...stateWithTask(),
        selectedTaskIds: new Set(["task-1"]),
      };
      const next = boardReducer(state, {
        type: "REMOVE_TASK",
        taskId: "task-1",
      });
      expect(next.selectedTaskIds.has("task-1")).toBe(false);
    });
  });

  describe("EDIT_TASK", () => {
    it("updates the task name", () => {
      const state = stateWithTask();
      const next = boardReducer(state, {
        type: "EDIT_TASK",
        taskId: "task-1",
        newName: "Updated",
      });
      expect(next.tasks["task-1"].name).toBe("Updated");
    });

    it("trims the new name", () => {
      const state = stateWithTask();
      const next = boardReducer(state, {
        type: "EDIT_TASK",
        taskId: "task-1",
        newName: "  trimmed  ",
      });
      expect(next.tasks["task-1"].name).toBe("trimmed");
    });

    it("returns unchanged state for empty new name", () => {
      const state = stateWithTask();
      expect(
        boardReducer(state, {
          type: "EDIT_TASK",
          taskId: "task-1",
          newName: "",
        }),
      ).toBe(state);
    });

    it("returns unchanged state for whitespace-only new name", () => {
      const state = stateWithTask();
      expect(
        boardReducer(state, {
          type: "EDIT_TASK",
          taskId: "task-1",
          newName: "   ",
        }),
      ).toBe(state);
    });
  });

  describe("TOGGLE_TASK", () => {
    it("flips completed from false to true", () => {
      const state = stateWithTask("col-1", "task-1", "Test", false);
      const next = boardReducer(state, {
        type: "TOGGLE_TASK",
        taskId: "task-1",
      });
      expect(next.tasks["task-1"].completed).toBe(true);
    });

    it("flips completed from true to false", () => {
      const state = stateWithTask("col-1", "task-1", "Test", true);
      const next = boardReducer(state, {
        type: "TOGGLE_TASK",
        taskId: "task-1",
      });
      expect(next.tasks["task-1"].completed).toBe(false);
    });
  });

  describe("MOVE_TASK", () => {
    it("moves a task between columns", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
          "col-2": { id: "col-2", title: "B", taskIds: ["t3"] },
        },
        columnOrder: ["col-1", "col-2"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
          t3: { id: "t3", name: "T3", completed: false },
        },
      };

      const next = boardReducer(state, {
        type: "MOVE_TASK",
        taskId: "t1",
        targetColumnId: "col-2",
        targetIndex: 0,
      });
      expect(next.columns["col-1"].taskIds).toEqual(["t2"]);
      expect(next.columns["col-2"].taskIds).toEqual(["t1", "t3"]);
    });

    it("reorders within the same column when source equals target", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2", "t3"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
          t3: { id: "t3", name: "T3", completed: false },
        },
      };

      const next = boardReducer(state, {
        type: "MOVE_TASK",
        taskId: "t1",
        targetColumnId: "col-1",
        targetIndex: 2,
      });
      expect(next.columns["col-1"].taskIds).toEqual(["t2", "t3", "t1"]);
    });
  });

  describe("REORDER_TASK", () => {
    it("moves a task to a new index within its column", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2", "t3"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
          t3: { id: "t3", name: "T3", completed: false },
        },
      };

      const next = boardReducer(state, {
        type: "REORDER_TASK",
        columnId: "col-1",
        taskId: "t3",
        newIndex: 0,
      });
      expect(next.columns["col-1"].taskIds).toEqual(["t3", "t1", "t2"]);
    });
  });

  describe("ADD_COLUMN", () => {
    it("adds a new column with default title", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "new-col" as `${string}-${string}-${string}-${string}-${string}`,
      );
      const state = createDefaultState();
      const next = boardReducer(state, { type: "ADD_COLUMN" });

      expect(next.columns["new-col"]).toEqual({
        id: "new-col",
        title: "New Column",
        taskIds: [],
      });
      expect(next.columnOrder).toEqual(["new-col"]);
    });
  });

  describe("DELETE_COLUMN", () => {
    it("removes the column, its tasks, and cleans up selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
        },
        selectedTaskIds: new Set(["t1"]),
      };

      const next = boardReducer(state, {
        type: "DELETE_COLUMN",
        columnId: "col-1",
      });
      expect(next.columns["col-1"]).toBeUndefined();
      expect(next.columnOrder).toEqual([]);
      expect(next.tasks["t1"]).toBeUndefined();
      expect(next.tasks["t2"]).toBeUndefined();
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("RENAME_COLUMN", () => {
    it("updates the column title", () => {
      const state = stateWithColumn("col-1", "Old Title");
      const next = boardReducer(state, {
        type: "RENAME_COLUMN",
        columnId: "col-1",
        newTitle: "New Title",
      });
      expect(next.columns["col-1"].title).toBe("New Title");
    });
  });

  describe("REORDER_COLUMN", () => {
    it("moves a column to a new position", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          a: { id: "a", title: "A", taskIds: [] },
          b: { id: "b", title: "B", taskIds: [] },
          c: { id: "c", title: "C", taskIds: [] },
        },
        columnOrder: ["a", "b", "c"],
      };

      const next = boardReducer(state, {
        type: "REORDER_COLUMN",
        columnId: "c",
        newIndex: 0,
      });
      expect(next.columnOrder).toEqual(["c", "a", "b"]);
    });
  });

  describe("TOGGLE_BULK_SELECT", () => {
    it("adds a task to selection", () => {
      const state = stateWithTask();
      const next = boardReducer(state, {
        type: "TOGGLE_BULK_SELECT",
        taskId: "task-1",
      });
      expect(next.selectedTaskIds.has("task-1")).toBe(true);
    });

    it("removes a task from selection if already selected", () => {
      const state = {
        ...stateWithTask(),
        selectedTaskIds: new Set(["task-1"]),
      };
      const next = boardReducer(state, {
        type: "TOGGLE_BULK_SELECT",
        taskId: "task-1",
      });
      expect(next.selectedTaskIds.has("task-1")).toBe(false);
    });
  });

  describe("SELECT_ALL_IN_COLUMN", () => {
    it("adds all tasks in the column to selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: true },
        },
      };

      const next = boardReducer(state, {
        type: "SELECT_ALL_IN_COLUMN",
        columnId: "col-1",
      });
      expect(next.selectedTaskIds.has("t1")).toBe(true);
      expect(next.selectedTaskIds.has("t2")).toBe(true);
    });
  });

  describe("CLEAR_BULK_SELECTION", () => {
    it("empties the selection", () => {
      const state = {
        ...stateWithTask(),
        selectedTaskIds: new Set(["task-1"]),
      };
      const next = boardReducer(state, { type: "CLEAR_BULK_SELECTION" });
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("BULK_DELETE", () => {
    it("removes all selected tasks and clears selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2", "t3"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
          t3: { id: "t3", name: "T3", completed: false },
        },
        selectedTaskIds: new Set(["t1", "t3"]),
      };

      const next = boardReducer(state, { type: "BULK_DELETE" });
      expect(Object.keys(next.tasks)).toEqual(["t2"]);
      expect(next.columns["col-1"].taskIds).toEqual(["t2"]);
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("BULK_MARK_COMPLETE", () => {
    it("marks all selected tasks as complete and clears selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
        },
        selectedTaskIds: new Set(["t1", "t2"]),
      };

      const next = boardReducer(state, { type: "BULK_MARK_COMPLETE" });
      expect(next.tasks["t1"].completed).toBe(true);
      expect(next.tasks["t2"].completed).toBe(true);
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("BULK_MARK_INCOMPLETE", () => {
    it("marks all selected tasks as incomplete and clears selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
        },
        columnOrder: ["col-1"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: true },
          t2: { id: "t2", name: "T2", completed: true },
        },
        selectedTaskIds: new Set(["t1", "t2"]),
      };

      const next = boardReducer(state, { type: "BULK_MARK_INCOMPLETE" });
      expect(next.tasks["t1"].completed).toBe(false);
      expect(next.tasks["t2"].completed).toBe(false);
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("BULK_MOVE", () => {
    it("moves all selected tasks to the target column and clears selection", () => {
      const state: BoardState = {
        ...createDefaultState(),
        columns: {
          "col-1": { id: "col-1", title: "A", taskIds: ["t1", "t2"] },
          "col-2": { id: "col-2", title: "B", taskIds: [] },
        },
        columnOrder: ["col-1", "col-2"],
        tasks: {
          t1: { id: "t1", name: "T1", completed: false },
          t2: { id: "t2", name: "T2", completed: false },
        },
        selectedTaskIds: new Set(["t1"]),
      };

      const next = boardReducer(state, {
        type: "BULK_MOVE",
        targetColumnId: "col-2",
      });
      expect(next.columns["col-1"].taskIds).toEqual(["t2"]);
      expect(next.columns["col-2"].taskIds).toEqual(["t1"]);
      expect(next.selectedTaskIds.size).toBe(0);
    });
  });

  describe("SET_SEARCH_QUERY", () => {
    it("updates the search query", () => {
      const state = createDefaultState();
      const next = boardReducer(state, {
        type: "SET_SEARCH_QUERY",
        query: "hello",
      });
      expect(next.searchQuery).toBe("hello");
    });
  });

  describe("SET_FILTER", () => {
    it("updates the filter", () => {
      const state = createDefaultState();
      const next = boardReducer(state, {
        type: "SET_FILTER",
        filter: "completed",
      });
      expect(next.filter).toBe("completed");
    });
  });

  describe("LOAD_STATE", () => {
    it("replaces the entire state", () => {
      const state = createDefaultState();
      const newState = stateWithTask();
      const next = boardReducer(state, { type: "LOAD_STATE", state: newState });
      expect(next).toBe(newState);
    });
  });
});
