/**
 * Smart search. Pure functions only: no DOM, no SharePoint, no imports.
 * Used by the section picker (filter + ranking) and by the table search (filter).
 *
 * Rules
 *  - normalize(): lowercase, no niqqud (U+0591-U+05C7), no quote characters (so חסד"פ -> חסדפ),
 *    hyphens/dashes become a space, whitespace collapsed.
 *  - A query is split on spaces into tokens. An item matches only if EVERY token is a substring
 *    of the normalized text, in any order and at any position (a word in the middle must match).
 *    An empty query matches everything.
 */

/** Niqqud / cantillation block, as required by the spec. */
const NIQQUD_FIRST = 0x0591;
const NIQQUD_LAST = 0x05c7;
/** Hebrew maqaf (U+05BE) sits inside the niqqud block but is a hyphen, so it is handled first. */
const MAQAF = 0x05be;

/** " ' ״ (gershayim) ׳ (geresh), plus typographic quotes that Word/phones produce. */
const QUOTE_CHARS = '"\'״׳“”‘’';
/** - and the Unicode dash family (hyphen, non-breaking hyphen, figure/en/em dash, horizontal bar, minus). */
const DASH_CHARS = '-‐‑‒–—―−﹘﹣－';

export interface INormalized {
  /** The normalized text. */
  text: string;
  /** map[i] is the index in the original string of the character that produced text[i]. */
  map: number[];
}

function isNiqqud(code: number): boolean {
  return code >= NIQQUD_FIRST && code <= NIQQUD_LAST && code !== MAQAF;
}

/** normalize() that also reports where every output character came from (used for highlighting). */
export function normalizeWithMap(input: string): INormalized {
  const out: string[] = [];
  const map: number[] = [];
  let pendingSpaceAt = -1;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);
    const code = input.charCodeAt(i);

    if (code === MAQAF || DASH_CHARS.indexOf(ch) !== -1 || /\s/.test(ch)) {
      // A separator: remember the first one of a run, never emit leading/trailing/double spaces.
      if (out.length > 0 && pendingSpaceAt < 0) {
        pendingSpaceAt = i;
      }
      continue;
    }

    if (isNiqqud(code) || QUOTE_CHARS.indexOf(ch) !== -1) {
      continue; // removed without leaving a space: חסד"פ -> חסדפ
    }

    if (pendingSpaceAt >= 0) {
      out.push(' ');
      map.push(pendingSpaceAt);
      pendingSpaceAt = -1;
    }

    const lower = ch.toLowerCase();
    for (let k = 0; k < lower.length; k++) {
      out.push(lower.charAt(k));
      map.push(i);
    }
  }

  return { text: out.join(''), map };
}

export function normalize(text: string): string {
  return normalizeWithMap(text).text;
}

/** Normalizes the query and splits it into tokens. An empty/blank query gives []. */
export function tokenize(query: string): string[] {
  const normalized = normalize(query);
  return normalized === '' ? [] : normalized.split(' ');
}

/** True if every token is a substring of the (already normalized) text. No tokens = match. */
export function matchesNormalized(normalizedText: string, tokens: string[]): boolean {
  for (let i = 0; i < tokens.length; i++) {
    if (normalizedText.indexOf(tokens[i]) === -1) {
      return false;
    }
  }
  return true;
}

/** Convenience: does `text` match `query` under the smart-search rules? */
export function matches(text: string, query: string): boolean {
  return matchesNormalized(normalize(text), tokenize(query));
}

/** Rank 0 is best. */
export const RANK_ALL_WHOLE_WORDS = 0;
export const RANK_SOME_WHOLE_WORD = 1;
export const RANK_STARTS_WITH = 2;
export const RANK_OTHER = 3;

/**
 * Ranking of an item that already matches (section picker only):
 *  0/1  a token equals a whole word of the label ("12" in "סעיף 12", but not in "סעיף 112").
 *       0 = every token is a whole word, 1 = at least one is. This split makes the query
 *       "סעיף 12" put "סעיף 12" above "סעיף 112" ("סעיף" is a whole word in both).
 *  2    the label starts with a token.
 *  3    everything else (plain substring).
 */
export function rankOf(normalizedLabel: string, tokens: string[]): number {
  if (tokens.length === 0) {
    return RANK_OTHER;
  }
  const words = normalizedLabel.split(' ');
  let wholeWordTokens = 0;
  let startsWithToken = false;

  for (let i = 0; i < tokens.length; i++) {
    if (words.indexOf(tokens[i]) !== -1) {
      wholeWordTokens++;
    }
    if (normalizedLabel.indexOf(tokens[i]) === 0) {
      startsWithToken = true;
    }
  }

  if (wholeWordTokens === tokens.length) {
    return RANK_ALL_WHOLE_WORDS;
  }
  if (wholeWordTokens > 0) {
    return RANK_SOME_WHOLE_WORD;
  }
  return startsWithToken ? RANK_STARTS_WITH : RANK_OTHER;
}

/**
 * Filters without re-ordering (used by the table search).
 * @param normalizedTexts one already-normalized text per item
 * @returns indexes of the matching items, in source order
 */
export function filterIndexes(normalizedTexts: string[], query: string): number[] {
  const tokens = tokenize(query);
  const result: number[] = [];
  for (let i = 0; i < normalizedTexts.length; i++) {
    if (matchesNormalized(normalizedTexts[i], tokens)) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Filters and ranks (used by the section picker). Inside a rank the source order is kept.
 * An empty query returns every index in source order.
 * @param normalizedLabels one already-normalized label per item
 * @returns indexes of the matching items, best rank first
 */
export function rankIndexes(normalizedLabels: string[], query: string): number[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return normalizedLabels.map((_label, index) => index);
  }

  const buckets: number[][] = [[], [], [], []];
  for (let i = 0; i < normalizedLabels.length; i++) {
    if (matchesNormalized(normalizedLabels[i], tokens)) {
      buckets[rankOf(normalizedLabels[i], tokens)].push(i);
    }
  }
  return buckets[0].concat(buckets[1], buckets[2], buckets[3]);
}

export interface ITextSegment {
  text: string;
  highlight: boolean;
}

/**
 * Splits the ORIGINAL text into segments, marking where the tokens matched.
 * Matching is done on the normalized text and mapped back, so "חסדפ" highlights `חסד"פ` as a whole.
 */
export function highlightSegments(text: string, tokens: string[]): ITextSegment[] {
  if (tokens.length === 0 || text === '') {
    return [{ text, highlight: false }];
  }

  const normalized = normalizeWithMap(text);
  const marked: boolean[] = [];
  for (let i = 0; i < normalized.text.length; i++) {
    marked.push(false);
  }

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    if (token === '') {
      continue;
    }
    let from = normalized.text.indexOf(token);
    while (from !== -1) {
      for (let k = from; k < from + token.length; k++) {
        marked[k] = true;
      }
      from = normalized.text.indexOf(token, from + 1);
    }
  }

  // Marked runs in the normalized text -> ranges in the original text.
  const ranges: Array<[number, number]> = [];
  let i = 0;
  while (i < marked.length) {
    if (!marked[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < marked.length && marked[j + 1]) {
      j++;
    }
    const start = normalized.map[i];
    let end = normalized.map[j] + 1;
    // Never split a letter from its niqqud.
    while (end < text.length && isNiqqud(text.charCodeAt(end))) {
      end++;
    }
    const last = ranges[ranges.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      ranges.push([start, end]);
    }
    i = j + 1;
  }

  const segments: ITextSegment[] = [];
  let cursor = 0;
  for (let r = 0; r < ranges.length; r++) {
    if (ranges[r][0] > cursor) {
      segments.push({ text: text.substring(cursor, ranges[r][0]), highlight: false });
    }
    segments.push({ text: text.substring(ranges[r][0], ranges[r][1]), highlight: true });
    cursor = ranges[r][1];
  }
  if (cursor < text.length) {
    segments.push({ text: text.substring(cursor), highlight: false });
  }
  return segments.length > 0 ? segments : [{ text, highlight: false }];
}
