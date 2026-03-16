import { SearchBar } from "./SearchBar";
import { FilterSelect } from "./FilterSelect";
import { BulkActionsBar } from "./BulkActionsBar";
import styles from "./Toolbar.module.css";

export function Toolbar() {
  return (
    <div className={styles.toolbar}>
      <div className={styles.topRow}>
        <div className={styles.searchWrapper}>
          <SearchBar />
        </div>
        <FilterSelect />
      </div>
      <BulkActionsBar />
    </div>
  );
}
