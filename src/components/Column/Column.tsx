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
import { getVisibleTasks } from "../../search/getVisibleTasks";
import { TaskCard } from "../TaskCard/TaskCard";
import type { Column as ColumnType } from "../../types";
import styles from "./Column.module.css";

interface ColumnProps {
  column: ColumnType;
}

export function Column({ column }: ColumnProps) {
  const { state, dispatch } = useBoardContext();

  // Column title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Task input
  const [taskInputValue, setTaskInputValue] = useState("");
  const [validationMsg, setValidationMsg] = useState("");

  // DnD state
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  // Refs for DnD
  const columnRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  // Register as Pragmatic DnD draggable
  useEffect(() => {
    const el = columnRef.current;
    const handle = dragHandleRef.current;
    if (!el || !handle) return;

    return draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({ type: "column", columnId: column.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [column.id]);

  // Register as Pragmatic DnD drop target (accepts tasks and columns)
  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          { type: "column", columnId: column.id },
          { input, element, allowedEdges: ["left", "right"] },
        );
      },
      onDragEnter: ({ self, source }) => {
        if (source.data.type === "column") {
          setIsColumnDragOver(true);
          setClosestEdge(extractClosestEdge(self.data));
        } else {
          setIsDropTarget(true);
        }
      },
      onDrag: ({ self, source }) => {
        if (source.data.type === "column") {
          setClosestEdge(extractClosestEdge(self.data));
        }
      },
      onDragLeave: () => {
        setIsDropTarget(false);
        setIsColumnDragOver(false);
        setClosestEdge(null);
      },
      onDrop: () => {
        setIsDropTarget(false);
        setIsColumnDragOver(false);
        setClosestEdge(null);
      },
    });
  }, [column.id]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Clear validation message after 3 seconds
  useEffect(() => {
    if (!validationMsg) return;
    const timer = setTimeout(() => setValidationMsg(""), 3000);
    return () => clearTimeout(timer);
  }, [validationMsg]);

  // --- Title editing handlers ---
  function handleTitleClick() {
    setTitleValue(column.title);
    setIsEditingTitle(true);
  }

  function handleTitleConfirm() {
    const trimmed = titleValue.trim();
    if (trimmed.length > 0) {
      dispatch({
        type: "RENAME_COLUMN",
        columnId: column.id,
        newTitle: trimmed,
      });
    }
    setIsEditingTitle(false);
  }

  function handleTitleCancel() {
    setIsEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleTitleConfirm();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  }

  // --- Task input handlers ---
  function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = taskInputValue.trim();
    if (trimmed.length === 0) {
      setValidationMsg("Task name is required.");
      return;
    }
    dispatch({ type: "ADD_TASK", columnId: column.id, taskName: trimmed });
    setTaskInputValue("");
    setValidationMsg("");
  }

  function handleTaskInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTaskInputValue(e.target.value);
    if (validationMsg) setValidationMsg("");
  }

  // --- Column actions ---
  function handleDeleteColumn() {
    dispatch({ type: "DELETE_COLUMN", columnId: column.id });
  }

  function handleSelectAll() {
    if (allSelected) {
      dispatch({ type: "DESELECT_ALL_IN_COLUMN", columnId: column.id });
    } else {
      dispatch({ type: "SELECT_ALL_IN_COLUMN", columnId: column.id });
    }
  }

  // --- Visible tasks ---
  const visibleTasks = getVisibleTasks(
    column,
    state.tasks,
    state.filter,
    state.searchQuery,
  );

  // --- Select-all checkbox state ---
  const selectAllRef = useRef<HTMLInputElement>(null);
  const columnTaskIds = column.taskIds;
  const selectedCount = columnTaskIds.filter((id) =>
    state.selectedTaskIds.has(id),
  ).length;
  const allSelected =
    columnTaskIds.length > 0 && selectedCount === columnTaskIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Build className
  const columnClassName = [
    styles.column,
    isDragging ? styles.columnDragging : "",
    isDropTarget ? styles.columnDropTarget : "",
    isColumnDragOver && closestEdge === "left" ? styles.columnDropLeft : "",
    isColumnDragOver && closestEdge === "right" ? styles.columnDropRight : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={columnRef} className={columnClassName} data-column-id={column.id}>
      {/* Column Header */}
      <div className={styles.header}>
        <button
          ref={dragHandleRef}
          className={styles.dragHandle}
          tabIndex={0}
          aria-label="Drag column"
          type="button"
        >
          ≡
        </button>

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            className={styles.titleInput}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleConfirm}
            aria-label="Edit column title"
          />
        ) : (
          <span
            className={styles.title}
            onClick={handleTitleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleTitleClick();
            }}
          >
            {column.title}
          </span>
        )}

        <input
          ref={selectAllRef}
          type="checkbox"
          className={styles.selectAllCheckbox}
          onChange={handleSelectAll}
          checked={allSelected}
          aria-label="Select all tasks in column"
        />

        <button
          className={styles.deleteBtn}
          onClick={handleDeleteColumn}
          aria-label="Delete column"
          type="button"
        >
          🗑️
        </button>
      </div>

      {/* Task Input */}
      <form className={styles.taskInputForm} onSubmit={handleTaskSubmit}>
        <input
          type="text"
          className={styles.taskInput}
          value={taskInputValue}
          onChange={handleTaskInputChange}
          placeholder="Add a task…"
          aria-label="New task name"
        />
        <button className={styles.addBtn} type="submit" aria-label="Add task">
          +
        </button>
      </form>
      {validationMsg && (
        <div className={styles.validationMsg} role="alert">
          {validationMsg}
        </div>
      )}

      {/* Task List */}
      <div className={styles.taskList}>
        {visibleTasks.map((result) => {
          const task = state.tasks[result.taskId];
          if (!task) return null;
          return (
            <TaskCard
              key={task.id}
              task={task}
              searchResult={result}
              isSelected={state.selectedTaskIds.has(task.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
