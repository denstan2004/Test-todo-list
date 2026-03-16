export interface Task {
  id: string;
  name: string;
  completed: boolean;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardState {
  columns: Record<string, Column>;
  columnOrder: string[];
  tasks: Record<string, Task>;
  selectedTaskIds: Set<string>;
  searchQuery: string;
  filter: FilterType;
}

export type FilterType = "all" | "completed" | "incomplete";

export interface PersistedBoardState {
  columns: Record<string, Column>;
  columnOrder: string[];
  tasks: Record<string, Task>;
}

export interface SearchResult {
  taskId: string;
  matchType: "exact" | "fuzzy";
  matchStart: number;
  matchEnd: number;
  score: number;
}

export type BoardAction =
  | { type: "ADD_TASK"; columnId: string; taskName: string }
  | { type: "REMOVE_TASK"; taskId: string }
  | { type: "EDIT_TASK"; taskId: string; newName: string }
  | { type: "TOGGLE_TASK"; taskId: string }
  | {
      type: "MOVE_TASK";
      taskId: string;
      targetColumnId: string;
      targetIndex: number;
    }
  | { type: "REORDER_TASK"; columnId: string; taskId: string; newIndex: number }
  | { type: "ADD_COLUMN" }
  | { type: "DELETE_COLUMN"; columnId: string }
  | { type: "RENAME_COLUMN"; columnId: string; newTitle: string }
  | { type: "REORDER_COLUMN"; columnId: string; newIndex: number }
  | { type: "TOGGLE_BULK_SELECT"; taskId: string }
  | { type: "SELECT_ALL_IN_COLUMN"; columnId: string }
  | { type: "DESELECT_ALL_IN_COLUMN"; columnId: string }
  | { type: "CLEAR_BULK_SELECTION" }
  | { type: "BULK_DELETE" }
  | { type: "BULK_MARK_COMPLETE" }
  | { type: "BULK_MARK_INCOMPLETE" }
  | { type: "BULK_MOVE"; targetColumnId: string }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_FILTER"; filter: FilterType }
  | { type: "LOAD_STATE"; state: BoardState };
