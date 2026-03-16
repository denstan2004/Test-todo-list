import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useBoardContext } from "../../state/BoardContext";
import type { Task, SearchResult } from "../../types";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  searchResult?: SearchResult;
  isSelected: boolean;
}

export function TaskCard({ task, searchResult, isSelected }: TaskCardProps) {
  const { dispatch } = useBoardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.name);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Register Pragmatic DnD draggable
  useEffect(() => {
    const el = cardRef.current;
    const handle = dragHandleRef.current;
    if (!el || !handle) return;

    return draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({ type: "task", taskId: task.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [task.id]);

  // Register as drop target for task reordering
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { type: "task", taskId: task.id },
          { input, element, allowedEdges: ["top", "bottom"] },
        );
      },
      canDrop: ({ source }) =>
        source.data.type === "task" && source.data.taskId !== task.id,
      onDragEnter: ({ self, location }) => {
        if (location.current.dropTargets[0]?.data.taskId === task.id) {
          setClosestEdge(extractClosestEdge(self.data));
        }
      },
      onDrag: ({ self, location }) => {
        if (location.current.dropTargets[0]?.data.taskId === task.id) {
          setClosestEdge(extractClosestEdge(self.data));
        } else {
          setClosestEdge(null);
        }
      },
      onDragLeave: () => {
        setClosestEdge(null);
      },
      onDrop: () => {
        setClosestEdge(null);
      },
    });
  }, [task.id]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  function handleToggleComplete() {
    dispatch({ type: "TOGGLE_TASK", taskId: task.id });
  }

  function handleToggleBulkSelect() {
    dispatch({ type: "TOGGLE_BULK_SELECT", taskId: task.id });
  }

  function handleDelete() {
    dispatch({ type: "REMOVE_TASK", taskId: task.id });
  }

  function handleStartEdit() {
    setEditValue(task.name);
    setIsEditing(true);
  }

  function handleConfirmEdit() {
    const trimmed = editValue.trim();
    if (trimmed.length > 0) {
      dispatch({ type: "EDIT_TASK", taskId: task.id, newName: trimmed });
    }
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleConfirmEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  function renderTaskName() {
    if (
      searchResult &&
      searchResult.matchStart >= 0 &&
      searchResult.matchEnd > searchResult.matchStart
    ) {
      const before = task.name.slice(0, searchResult.matchStart);
      const match = task.name.slice(
        searchResult.matchStart,
        searchResult.matchEnd,
      );
      const after = task.name.slice(searchResult.matchEnd);
      return (
        <>
          {before}
          <mark className={styles.highlight}>{match}</mark>
          {after}
        </>
      );
    }
    return task.name;
  }

  const cardClassName = [styles.card, isDragging ? styles.dragging : ""]
    .filter(Boolean)
    .join(" ");

  const nameClassName = [
    styles.taskName,
    task.completed ? styles.taskNameCompleted : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={cardRef}
      className={cardClassName}
      data-task-id={task.id}
      style={{ position: "relative" }}
    >
      {closestEdge === "top" && <div className={styles.dropIndicatorTop} />}
      {closestEdge === "bottom" && (
        <div className={styles.dropIndicatorBottom} />
      )}
      <button
        ref={dragHandleRef}
        className={styles.dragHandle}
        tabIndex={0}
        aria-label="Drag handle"
        type="button"
      >
        ≡
      </button>

      <input
        type="checkbox"
        className={styles.bulkCheckbox}
        checked={isSelected}
        onChange={handleToggleBulkSelect}
        aria-label="Select task for bulk operation"
      />

      <input
        type="checkbox"
        className={styles.checkbox}
        checked={task.completed}
        onChange={handleToggleComplete}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      />

      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          className={styles.editInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleConfirmEdit}
          aria-label="Edit task name"
        />
      ) : (
        <span className={nameClassName}>{renderTaskName()}</span>
      )}

      {!isEditing && (
        <>
          <button
            className={styles.actionBtn}
            onClick={handleStartEdit}
            aria-label="Edit task"
            type="button"
          >
            ✏️
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            aria-label="Delete task"
            type="button"
          >
            🗑️
          </button>
        </>
      )}
    </div>
  );
}
