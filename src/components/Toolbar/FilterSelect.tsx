import { useBoardContext } from "../../state/BoardContext";
import type { FilterType } from "../../types";
import styles from "./FilterSelect.module.css";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "incomplete", label: "Incomplete" },
];

export function FilterSelect() {
  const { state, dispatch } = useBoardContext();

  function handleSelect(filter: FilterType) {
    dispatch({ type: "SET_FILTER", filter });
  }

  return (
    <div className={styles.group} role="group" aria-label="Filter tasks">
      {FILTER_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`${styles.button} ${state.filter === value ? styles.active : ""}`}
          onClick={() => handleSelect(value)}
          aria-pressed={state.filter === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
