/**
 * Computes the Levenshtein (edit) distance between two strings
 * using the Wagner-Fischer algorithm with single-row optimization.
 *
 * Space complexity: O(min(m, n))
 * Time complexity: O(m * n)
 *
 * Case-sensitive — caller is responsible for normalization.
 */
export function levenshteinDistance(a: string, b: string): number {
  // Ensure `a` is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const m = a.length;
  const n = b.length;

  // Previous row of distances
  let prev = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= n; i++) {
    const curr = new Array<number>(m + 1);
    curr[0] = i;

    for (let j = 1; j <= m; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }

    prev = curr;
  }

  return prev[m];
}
