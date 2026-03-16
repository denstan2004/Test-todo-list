import type { BoardState, PersistedBoardState } from "../types";
import { createDefaultState } from "./boardReducer";

const STORAGE_KEY = "kanban-board-state";

export function saveBoardState(state: BoardState): void {
  const persisted: PersistedBoardState = {
    columns: state.columns,
    columnOrder: state.columnOrder,
    tasks: state.tasks,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function loadBoardState(): BoardState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return createDefaultState();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(
      "Failed to parse board state from localStorage. Resetting to default.",
    );
    return createDefaultState();
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !isValidPersistedState(parsed as Record<string, unknown>)
  ) {
    console.warn(
      "Corrupted board state in localStorage. Resetting to default.",
    );
    return createDefaultState();
  }

  const persisted = parsed as PersistedBoardState;
  return {
    columns: persisted.columns,
    columnOrder: persisted.columnOrder,
    tasks: persisted.tasks,
    selectedTaskIds: new Set<string>(),
    searchQuery: "",
    filter: "all",
  };
}

function isValidPersistedState(data: Record<string, unknown>): boolean {
  return (
    typeof data.columns === "object" &&
    data.columns !== null &&
    !Array.isArray(data.columns) &&
    Array.isArray(data.columnOrder) &&
    typeof data.tasks === "object" &&
    data.tasks !== null &&
    !Array.isArray(data.tasks)
  );
}
