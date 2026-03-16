import { useEffect } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { BoardState, BoardAction } from "../types";

/**
 * Finds which column a task belongs to.
 */
function findColumnForTask(taskId: string, state: BoardState): string | null {
  for (const [colId, col] of Object.entries(state.columns)) {
    if (col.taskIds.includes(taskId)) {
      return colId;
    }
  }
  return null;
}

/**
 * Central drag-and-drop monitor that listens for all drop events
 * and dispatches the appropriate board actions.
 */
export function useDragAndDrop(
  state: BoardState,
  dispatch: React.Dispatch<BoardAction>,
) {
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const dropTargets = location.current.dropTargets;
        if (dropTargets.length === 0) return;

        const sourceData = source.data;

        if (sourceData.type === "task") {
          handleTaskDrop(
            sourceData as { type: string; taskId: string },
            dropTargets,
            state,
            dispatch,
          );
        } else if (sourceData.type === "column") {
          handleColumnDrop(
            sourceData as { type: string; columnId: string },
            dropTargets,
            state,
            dispatch,
          );
        }
      },
    });
  }, [state, dispatch]);
}

function handleTaskDrop(
  sourceData: { type: string; taskId: string },
  dropTargets: Array<{ data: Record<string, unknown> }>,
  state: BoardState,
  dispatch: React.Dispatch<BoardAction>,
) {
  const taskId = sourceData.taskId;
  const sourceColumnId = findColumnForTask(taskId, state);
  if (!sourceColumnId) return;

  // Find the innermost task target and/or column target
  const taskTarget = dropTargets.find((t) => t.data.type === "task");
  const columnTarget = dropTargets.find((t) => t.data.type === "column");

  if (taskTarget) {
    // Dropped on a task — determine position based on closest edge
    const targetTaskId = taskTarget.data.taskId as string;
    const targetColumnId = findColumnForTask(targetTaskId, state);
    if (!targetColumnId) return;

    const targetColumn = state.columns[targetColumnId];
    if (!targetColumn) return;

    const closestEdge = extractClosestEdge(taskTarget.data);
    const targetTaskIndex = targetColumn.taskIds.indexOf(targetTaskId);

    // Calculate insertion index based on edge
    let targetIndex: number;
    if (closestEdge === "bottom") {
      targetIndex = targetTaskIndex + 1;
    } else {
      // "top" or null — insert before
      targetIndex = targetTaskIndex;
    }

    // If same column, adjust index for removal of source
    if (sourceColumnId === targetColumnId) {
      const sourceIndex = targetColumn.taskIds.indexOf(taskId);
      if (sourceIndex < targetIndex) {
        targetIndex -= 1;
      }
      // No-op if position unchanged
      if (sourceIndex === targetIndex) return;

      dispatch({
        type: "REORDER_TASK",
        columnId: sourceColumnId,
        taskId,
        newIndex: targetIndex,
      });
    } else {
      dispatch({
        type: "MOVE_TASK",
        taskId,
        targetColumnId,
        targetIndex,
      });
    }
  } else if (columnTarget) {
    // Dropped on a column (empty area) — append to end
    const targetColumnId = columnTarget.data.columnId as string;
    const targetColumn = state.columns[targetColumnId];
    if (!targetColumn) return;

    if (sourceColumnId === targetColumnId) return; // Already in this column

    dispatch({
      type: "MOVE_TASK",
      taskId,
      targetColumnId,
      targetIndex: targetColumn.taskIds.length,
    });
  }
}

function handleColumnDrop(
  sourceData: { type: string; columnId: string },
  dropTargets: Array<{ data: Record<string, unknown> }>,
  state: BoardState,
  dispatch: React.Dispatch<BoardAction>,
) {
  const sourceColumnId = sourceData.columnId;

  // Find the target column in drop targets
  const columnTarget = dropTargets.find(
    (t) => t.data.type === "column" && t.data.columnId !== sourceColumnId,
  );

  if (!columnTarget) return;

  const targetColumnId = columnTarget.data.columnId as string;
  const closestEdge = extractClosestEdge(columnTarget.data);

  const targetIndex = state.columnOrder.indexOf(targetColumnId);
  if (targetIndex === -1) return;

  const sourceIndex = state.columnOrder.indexOf(sourceColumnId);
  if (sourceIndex === -1) return;

  let newIndex: number;
  if (closestEdge === "right") {
    newIndex = targetIndex + 1;
  } else if (closestEdge === "left") {
    newIndex = targetIndex;
  } else {
    // null edge — place at the target's position
    newIndex = targetIndex;
    // If dragging forward, place after the target instead of before
    if (sourceIndex < targetIndex) {
      newIndex = targetIndex + 1;
    }
  }

  // Adjust for removal of source
  if (sourceIndex < newIndex) {
    newIndex -= 1;
  }

  if (sourceIndex === newIndex) return;

  dispatch({
    type: "REORDER_COLUMN",
    columnId: sourceColumnId,
    newIndex,
  });
}
