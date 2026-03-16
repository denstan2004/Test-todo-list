import type { BoardState, BoardAction } from "../types";

export function createDefaultState(): BoardState {
  return {
    columns: {},
    columnOrder: [],
    tasks: {},
    selectedTaskIds: new Set<string>(),
    searchQuery: "",
    filter: "all",
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "ADD_TASK": {
      const trimmed = action.taskName.trim();
      if (!trimmed) return state;

      const column = state.columns[action.columnId];
      if (!column) return state;

      const id = crypto.randomUUID();
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [id]: { id, name: trimmed, completed: false },
        },
        columns: {
          ...state.columns,
          [action.columnId]: {
            ...column,
            taskIds: [...column.taskIds, id],
          },
        },
      };
    }

    case "REMOVE_TASK": {
      const { [action.taskId]: _, ...remainingTasks } = state.tasks;

      const columns: Record<string, (typeof state.columns)[string]> = {};
      for (const [colId, col] of Object.entries(state.columns)) {
        const filtered = col.taskIds.filter((id) => id !== action.taskId);
        columns[colId] =
          filtered.length !== col.taskIds.length
            ? { ...col, taskIds: filtered }
            : col;
      }

      const selectedTaskIds = new Set(state.selectedTaskIds);
      selectedTaskIds.delete(action.taskId);

      return { ...state, tasks: remainingTasks, columns, selectedTaskIds };
    }

    case "EDIT_TASK": {
      const trimmed = action.newName.trim();
      if (!trimmed) return state;

      const task = state.tasks[action.taskId];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.taskId]: { ...task, name: trimmed },
        },
      };
    }

    case "TOGGLE_TASK": {
      const task = state.tasks[action.taskId];
      if (!task) return state;

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.taskId]: { ...task, completed: !task.completed },
        },
      };
    }

    case "MOVE_TASK": {
      const { taskId, targetColumnId, targetIndex } = action;

      // Find source column
      let sourceColumnId: string | null = null;
      for (const [colId, col] of Object.entries(state.columns)) {
        if (col.taskIds.includes(taskId)) {
          sourceColumnId = colId;
          break;
        }
      }
      if (!sourceColumnId) return state;

      const sourceColumn = state.columns[sourceColumnId];
      const targetColumn = state.columns[targetColumnId];
      if (!targetColumn) return state;

      if (sourceColumnId === targetColumnId) {
        // Same column — just reorder
        const newTaskIds = sourceColumn.taskIds.filter((id) => id !== taskId);
        newTaskIds.splice(targetIndex, 0, taskId);
        return {
          ...state,
          columns: {
            ...state.columns,
            [sourceColumnId]: { ...sourceColumn, taskIds: newTaskIds },
          },
        };
      }

      // Different columns
      const newSourceTaskIds = sourceColumn.taskIds.filter(
        (id) => id !== taskId,
      );
      const newTargetTaskIds = [...targetColumn.taskIds];
      newTargetTaskIds.splice(targetIndex, 0, taskId);

      return {
        ...state,
        columns: {
          ...state.columns,
          [sourceColumnId]: { ...sourceColumn, taskIds: newSourceTaskIds },
          [targetColumnId]: { ...targetColumn, taskIds: newTargetTaskIds },
        },
      };
    }

    case "REORDER_TASK": {
      const column = state.columns[action.columnId];
      if (!column) return state;

      const newTaskIds = column.taskIds.filter((id) => id !== action.taskId);
      newTaskIds.splice(action.newIndex, 0, action.taskId);

      return {
        ...state,
        columns: {
          ...state.columns,
          [action.columnId]: { ...column, taskIds: newTaskIds },
        },
      };
    }

    case "ADD_COLUMN": {
      const id = crypto.randomUUID();
      return {
        ...state,
        columns: {
          ...state.columns,
          [id]: { id, title: "New Column", taskIds: [] },
        },
        columnOrder: [...state.columnOrder, id],
      };
    }

    case "DELETE_COLUMN": {
      const column = state.columns[action.columnId];
      if (!column) return state;

      const { [action.columnId]: _, ...remainingColumns } = state.columns;

      // Remove all tasks belonging to this column
      const remainingTasks = { ...state.tasks };
      for (const taskId of column.taskIds) {
        delete remainingTasks[taskId];
      }

      // Clean up selectedTaskIds
      const selectedTaskIds = new Set(state.selectedTaskIds);
      for (const taskId of column.taskIds) {
        selectedTaskIds.delete(taskId);
      }

      return {
        ...state,
        columns: remainingColumns,
        columnOrder: state.columnOrder.filter((id) => id !== action.columnId),
        tasks: remainingTasks,
        selectedTaskIds,
      };
    }

    case "RENAME_COLUMN": {
      const column = state.columns[action.columnId];
      if (!column) return state;

      return {
        ...state,
        columns: {
          ...state.columns,
          [action.columnId]: { ...column, title: action.newTitle },
        },
      };
    }

    case "REORDER_COLUMN": {
      const newColumnOrder = state.columnOrder.filter(
        (id) => id !== action.columnId,
      );
      newColumnOrder.splice(action.newIndex, 0, action.columnId);

      return { ...state, columnOrder: newColumnOrder };
    }

    case "TOGGLE_BULK_SELECT": {
      const selectedTaskIds = new Set(state.selectedTaskIds);
      if (selectedTaskIds.has(action.taskId)) {
        selectedTaskIds.delete(action.taskId);
      } else {
        selectedTaskIds.add(action.taskId);
      }
      return { ...state, selectedTaskIds };
    }

    case "SELECT_ALL_IN_COLUMN": {
      const column = state.columns[action.columnId];
      if (!column) return state;

      const selectedTaskIds = new Set(state.selectedTaskIds);
      for (const taskId of column.taskIds) {
        selectedTaskIds.add(taskId);
      }
      return { ...state, selectedTaskIds };
    }

    case "DESELECT_ALL_IN_COLUMN": {
      const column = state.columns[action.columnId];
      if (!column) return state;

      const selectedTaskIds = new Set(state.selectedTaskIds);
      for (const taskId of column.taskIds) {
        selectedTaskIds.delete(taskId);
      }
      return { ...state, selectedTaskIds };
    }

    case "CLEAR_BULK_SELECTION": {
      return { ...state, selectedTaskIds: new Set<string>() };
    }

    case "BULK_DELETE": {
      const remainingTasks = { ...state.tasks };
      for (const taskId of state.selectedTaskIds) {
        delete remainingTasks[taskId];
      }

      const columns: Record<string, (typeof state.columns)[string]> = {};
      for (const [colId, col] of Object.entries(state.columns)) {
        const filtered = col.taskIds.filter(
          (id) => !state.selectedTaskIds.has(id),
        );
        columns[colId] =
          filtered.length !== col.taskIds.length
            ? { ...col, taskIds: filtered }
            : col;
      }

      return {
        ...state,
        tasks: remainingTasks,
        columns,
        selectedTaskIds: new Set<string>(),
      };
    }

    case "BULK_MARK_COMPLETE": {
      const tasks = { ...state.tasks };
      for (const taskId of state.selectedTaskIds) {
        if (tasks[taskId]) {
          tasks[taskId] = { ...tasks[taskId], completed: true };
        }
      }
      return { ...state, tasks, selectedTaskIds: new Set<string>() };
    }

    case "BULK_MARK_INCOMPLETE": {
      const tasks = { ...state.tasks };
      for (const taskId of state.selectedTaskIds) {
        if (tasks[taskId]) {
          tasks[taskId] = { ...tasks[taskId], completed: false };
        }
      }
      return { ...state, tasks, selectedTaskIds: new Set<string>() };
    }

    case "BULK_MOVE": {
      const targetColumn = state.columns[action.targetColumnId];
      if (!targetColumn) return state;

      // Remove selected tasks from all columns, collect them for target
      const columns: Record<string, (typeof state.columns)[string]> = {};
      for (const [colId, col] of Object.entries(state.columns)) {
        const filtered = col.taskIds.filter(
          (id) => !state.selectedTaskIds.has(id),
        );
        columns[colId] =
          filtered.length !== col.taskIds.length
            ? { ...col, taskIds: filtered }
            : col;
      }

      // Append selected tasks to target column
      const movedTaskIds = [...state.selectedTaskIds];
      columns[action.targetColumnId] = {
        ...columns[action.targetColumnId],
        taskIds: [...columns[action.targetColumnId].taskIds, ...movedTaskIds],
      };

      return { ...state, columns, selectedTaskIds: new Set<string>() };
    }

    case "SET_SEARCH_QUERY": {
      return { ...state, searchQuery: action.query };
    }

    case "SET_FILTER": {
      return { ...state, filter: action.filter };
    }

    case "LOAD_STATE": {
      return action.state;
    }

    default:
      return state;
  }
}
