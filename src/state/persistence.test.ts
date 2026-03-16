import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveBoardState, loadBoardState } from "./persistence";
import { createDefaultState } from "./boardReducer";
import type { BoardState } from "../types";

function buildState(): BoardState {
  return {
    columns: {
      "col-1": { id: "col-1", title: "Todo", taskIds: ["t1", "t2"] },
      "col-2": { id: "col-2", title: "Done", taskIds: ["t3"] },
    },
    columnOrder: ["col-1", "col-2"],
    tasks: {
      t1: { id: "t1", name: "Task 1", completed: false },
      t2: { id: "t2", name: "Task 2", completed: true },
      t3: { id: "t3", name: "Task 3", completed: false },
    },
    selectedTaskIds: new Set(["t1"]),
    searchQuery: "hello",
    filter: "completed",
  };
}

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveBoardState and loadBoardState round-trip", () => {
    it("persists and restores columns, columnOrder, and tasks", () => {
      const state = buildState();
      saveBoardState(state);
      const loaded = loadBoardState();

      expect(loaded.columns).toEqual(state.columns);
      expect(loaded.columnOrder).toEqual(state.columnOrder);
      expect(loaded.tasks).toEqual(state.tasks);
    });

    it("does not persist selectedTaskIds, searchQuery, or filter", () => {
      const state = buildState();
      saveBoardState(state);

      const raw = JSON.parse(localStorage.getItem("kanban-board-state")!);
      expect(raw.selectedTaskIds).toBeUndefined();
      expect(raw.searchQuery).toBeUndefined();
      expect(raw.filter).toBeUndefined();
    });

    it("restores transient fields with default values", () => {
      const state = buildState();
      saveBoardState(state);
      const loaded = loadBoardState();

      expect(loaded.selectedTaskIds).toEqual(new Set());
      expect(loaded.searchQuery).toBe("");
      expect(loaded.filter).toBe("all");
    });
  });

  describe("loadBoardState with no data", () => {
    it("returns default state when localStorage is empty", () => {
      const loaded = loadBoardState();
      const defaultState = createDefaultState();

      expect(loaded.columns).toEqual(defaultState.columns);
      expect(loaded.columnOrder).toEqual(defaultState.columnOrder);
      expect(loaded.tasks).toEqual(defaultState.tasks);
      expect(loaded.selectedTaskIds).toEqual(defaultState.selectedTaskIds);
      expect(loaded.searchQuery).toBe(defaultState.searchQuery);
      expect(loaded.filter).toBe(defaultState.filter);
    });
  });

  describe("loadBoardState with corrupted data", () => {
    it("returns default state and warns on invalid JSON", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem("kanban-board-state", "not valid json{{{");

      const loaded = loadBoardState();
      const defaultState = createDefaultState();

      expect(loaded.columns).toEqual(defaultState.columns);
      expect(loaded.columnOrder).toEqual(defaultState.columnOrder);
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });

    it("returns default state and warns when columns is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(
        "kanban-board-state",
        JSON.stringify({ columnOrder: [], tasks: {} }),
      );

      const loaded = loadBoardState();
      expect(loaded.columns).toEqual({});
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });

    it("returns default state and warns when columnOrder is not an array", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(
        "kanban-board-state",
        JSON.stringify({ columns: {}, columnOrder: "not-array", tasks: {} }),
      );

      const loaded = loadBoardState();
      expect(loaded.columnOrder).toEqual([]);
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });

    it("returns default state and warns when tasks is an array", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(
        "kanban-board-state",
        JSON.stringify({ columns: {}, columnOrder: [], tasks: [] }),
      );

      const loaded = loadBoardState();
      expect(loaded.tasks).toEqual({});
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });
  });
});
