import type { Column, Task, FilterType, SearchResult } from "../types";
import { searchTasks } from "./searchEngine";

/**
 * Computes the visible tasks for a column by applying the active filter
 * and search query. Returns ordered SearchResult[] for rendering with highlights.
 */
export function getVisibleTasks(
  column: Column,
  tasks: Record<string, Task>,
  filter: FilterType,
  searchQuery: string,
): SearchResult[] {
  // 1. Get tasks in column order, filtering out any missing references
  const columnTasks = column.taskIds.map((id) => tasks[id]).filter(Boolean);

  // 2. Apply filter
  const filteredTasks = columnTasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  // 3. Apply search
  if (searchQuery.trim() !== "") {
    return searchTasks(filteredTasks, searchQuery);
  }

  // 4. No search query — return all filtered tasks as default SearchResults
  return filteredTasks.map((task) => ({
    taskId: task.id,
    matchType: "exact" as const,
    matchStart: 0,
    matchEnd: 0,
    score: 0,
  }));
}
