import type { Task, SearchResult } from "../types";
import { levenshteinDistance } from "./levenshtein";

/**
 * Searches tasks by name using exact case-insensitive substring matching
 * followed by fuzzy matching via Levenshtein distance on sliding windows.
 *
 * Results are sorted: exact matches first (score=0), then fuzzy by ascending score.
 */
export function searchTasks(tasks: Task[], query: string): SearchResult[] {
  if (query === "") {
    return [];
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const task of tasks) {
    const lowerName = task.name.toLowerCase();

    // Try exact case-insensitive substring match first
    const exactIndex = lowerName.indexOf(lowerQuery);
    if (exactIndex !== -1) {
      results.push({
        taskId: task.id,
        matchType: "exact",
        matchStart: exactIndex,
        matchEnd: exactIndex + query.length,
        score: 0,
      });
      continue;
    }

    // Fuzzy matching: slide a window of query length across the task name
    const windowLen = lowerQuery.length;
    if (windowLen === 0 || lowerName.length < windowLen) {
      continue;
    }

    let bestDistance = Infinity;
    let bestStart = 0;

    for (let i = 0; i <= lowerName.length - windowLen; i++) {
      const window = lowerName.substring(i, i + windowLen);
      const dist = levenshteinDistance(window, lowerQuery);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestStart = i;
      }
    }

    // Threshold: require exact match for very short queries,
    // then allow ~1 typo per 3 characters for longer ones
    const threshold =
      lowerQuery.length <= 2 ? 0 : Math.ceil(lowerQuery.length / 3);
    if (bestDistance <= threshold) {
      results.push({
        taskId: task.id,
        matchType: "fuzzy",
        matchStart: bestStart,
        matchEnd: bestStart + windowLen,
        score: bestDistance,
      });
    }
  }

  // Sort: exact matches first, then fuzzy by ascending score
  results.sort((a, b) => {
    if (a.matchType === "exact" && b.matchType !== "exact") return -1;
    if (a.matchType !== "exact" && b.matchType === "exact") return 1;
    return a.score - b.score;
  });

  return results;
}
