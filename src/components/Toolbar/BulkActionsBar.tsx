import { useBoardContext } from "../../state/BoardContext";
import styles from "./BulkActionsBar.module.css";

export function BulkActionsBar() {
  const { state, dispatch } = useBoardContext();

  if (state.selectedTaskIds.size === 0) {
    return null;
  }

  function handleBulkDelete() {
    dispatch({ type: "BULK_DELETE" });
  }

  function handleMarkComplete() {
    dispatch({ type: "BULK_MARK_COMPLETE" });
  }

  function handleMarkIncomplete() {
    dispatch({ type: "BULK_MARK_INCOMPLETE" });
  }

  function handleMoveToColumn(e: React.ChangeEvent<HTMLSelectElement>) {
    const targetColumnId = e.target.value;
    if (targetColumnId) {
      dispatch({ type: "BULK_MOVE", targetColumnId });
    }
  }

  function handleClearSelection() {
    dispatch({ type: "CLEAR_BULK_SELECTION" });
  }

  return (
    <div className={styles.bar} role="toolbar" aria-label="Bulk actions">
      <span className={styles.count}>
        {state.selectedTaskIds.size} selected
      </span>

      <button
        type="button"
        className={`${styles.button} ${styles.danger}`}
        onClick={handleBulkDelete}
      >
        Delete
      </button>

      <button
        type="button"
        className={styles.button}
        onClick={handleMarkComplete}
      >
        Complete
      </button>

      <button
        type="button"
        className={styles.button}
        onClick={handleMarkIncomplete}
      >
        Incomplete
      </button>

      <select
        className={styles.moveSelect}
        onChange={handleMoveToColumn}
        value=""
        aria-label="Move selected tasks to column"
      >
        <option value="" disabled>
          Move to…
        </option>
        {state.columnOrder.map((colId) => (
          <option key={colId} value={colId}>
            {state.columns[colId].title}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={styles.button}
        onClick={handleClearSelection}
      >
        Clear
      </button>
    </div>
  );
}
