import { useBoardContext } from "../../state/BoardContext";
import styles from "./SearchBar.module.css";

export function SearchBar() {
  const { state, dispatch } = useBoardContext();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: "SET_SEARCH_QUERY", query: e.target.value });
  }

  function handleClear() {
    dispatch({ type: "SET_SEARCH_QUERY", query: "" });
  }

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.input}
        placeholder="Search tasks…"
        value={state.searchQuery}
        onChange={handleChange}
        aria-label="Search tasks"
      />
      {state.searchQuery.length > 0 && (
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}
