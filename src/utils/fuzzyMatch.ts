/**
 * utils/fuzzyMatch.ts
 * Approximate string matching for staff names.
 *
 * Use case: A caller says "Can I book with Sarah?" but the Square roster
 * has "Sarah Johnson". We need to find the best match and confirm with the
 * caller before proceeding.
 *
 * Strategy:
 *   1. Normalise both strings (lowercase, trim, remove punctuation).
 *   2. Try exact match first.
 *   3. Try "contains" match (input is a substring of the name).
 *   4. Fall back to Levenshtein distance for typos.
 *   5. Return the best candidate above a confidence threshold, or null.
 *
 * Implementation: next session.
 */

export interface MatchResult {
  match: { id: string; name: string } | null;
  confidence: number; // 0–1
  ambiguous: boolean; // true if multiple candidates are equally close
}

export function fuzzyMatchStaff(
  _input: string,
  _candidates: Array<{ id: string; name: string }>,
): MatchResult {
  // Implementation: next session.
  throw new Error('Not implemented');
}
