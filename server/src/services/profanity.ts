// Basic Czech profanity word list for simple substring/regex filtering.
// Not exhaustive — Phase 1 implementation.
const PROFANITY_WORDS = [
  'kurva',
  'kurvo',
  'kurvy',
  'kurvit',
  'hovno',
  'hovnó',
  'hovně',
  'prdel',
  'prdele',
  'prdelka',
  'sráč',
  'srát',
  'sraní',
  'sračka',
  'píča',
  'piča',
  'pičo',
  'kokot',
  'kokote',
  'kokoti',
  'čůrák',
  'čurák',
  'debil',
  'debile',
  'blbec',
  'blbče',
  'kretén',
  'idiot',
  'idiote',
  'vůl',
  'vole',
  'hajzl',
  'hajzle',
  'zkurvit',
  'zkurvený',
  'zasraný',
  'posraný',
  'doprdele',
  'dohovna',
  'mrdat',
  'zmrd',
  'svině',
  'sviňo',
];

// Build regex patterns — match whole word boundaries where possible
const patterns = PROFANITY_WORDS.map(
  word => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
);

/**
 * Check if text contains any Czech profanity.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROFANITY_WORDS.some(word => lower.includes(word));
}

/**
 * Replace profanity with asterisks, preserving the rest of the text.
 */
export function filterProfanity(text: string): string {
  if (!text) return text;
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '***');
  }
  return result;
}
