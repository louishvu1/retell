/**
 * utils/fuzzyMatch.ts
 * Approximate string matching for staff names — no external dependencies.
 *
 * Strategy (in order):
 *   1. Exact match (case-insensitive)
 *   2. First-name-only match (caller says "Sarah" → "Sarah Johnson")
 *   3. Substring match (input is fully contained in candidate or vice versa)
 *   4. Levenshtein similarity for typos
 *
 * The returned confidence (0–1) drives the AI's response:
 *   ≥ 0.85  → treat as match, confirm with caller
 *   0.5–0.84 → ask "Did you mean X?"
 *   < 0.5   → no match, list available staff
 */

export interface MatchResult {
  match: { id: string; name: string } | null;
  confidence: number;  // 0–1
  ambiguous: boolean;  // true if two candidates scored equally close
}

/** Normalise: lowercase, trim, collapse whitespace. */
function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Classic Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // dp[i][j] = edit distance between a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/** Levenshtein-based similarity: 1 = identical, 0 = completely different. */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Find the best matching staff member for the caller's input.
 *
 * @param input      - What the caller said (e.g. "Sarah")
 * @param candidates - Full staff list from the booking provider
 */
export function fuzzyMatchStaff(
  input: string,
  candidates: Array<{ id: string; name: string }>,
): MatchResult {
  if (candidates.length === 0) {
    return { match: null, confidence: 0, ambiguous: false };
  }

  const normInput = normalise(input);

  const scored = candidates.map(candidate => {
    const normName = normalise(candidate.name);
    const firstName = normName.split(' ')[0] ?? '';

    let score = 0;

    // 1. Exact match
    if (normName === normInput) {
      score = 1.0;
    }
    // 2. First name match (caller said "Sarah", roster has "Sarah Johnson")
    else if (firstName === normInput) {
      score = 0.92;
    }
    // 3. Substring — input inside name (e.g. "sar" in "sarah johnson")
    else if (normName.includes(normInput)) {
      score = 0.85;
    }
    // 4. Substring — name inside input (rare but handles abbreviations)
    else if (normInput.includes(normName)) {
      score = 0.80;
    }
    // 5. Levenshtein similarity
    else {
      // Compare against full name AND first name, take best
      score = Math.max(similarity(normInput, normName), similarity(normInput, firstName));
    }

    return { candidate, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const second = scored[1];

  // Ambiguous if top two are very close (within 0.05)
  const ambiguous =
    second !== undefined && Math.abs(best.score - second.score) < 0.05 && best.score < 1.0;

  return {
    match: best.score >= 0.5 ? best.candidate : null,
    confidence: best.score,
    ambiguous,
  };
}
