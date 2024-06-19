/**
 * Difficulty values for Activities
 * 
 * It's more extensible if we treat difficulties as an integer index in the database
 * but it's more human friendly if we use labels.
 * 
 * Maybe an improvement here would be to refactor the Activity schema to create a pseudo-property
 * that does this mapping for us at the data layer? 
 * 
 * But maybe it's useful for this mapping to be transparent to the client? Not sure.
 * 
 * e.g. if a client wants to fetch a range of difficulties, it is more transparent to allow them to
 * express this as " 2 <= Difficulty <= 4", whereas "easy <= Difficulty <= challenging" is ambiguous
 * 
 * Maybe a better middle-ground is to make the Difficulty field of an activity be an object?
 * e.g. activity.difficulty = { rank: 2, label: 'medium' }
 * 
 * That would be nice since a difficulty label could then be contextual.
 * e.g. a difficult meditation might have { rank: 3, label: 'transcendent' }
 *      whereas a cross-fit exercise might have { rank: 3, label: 'punishing' }
 * 
 * These could then still be compared in terms of difficulty, but across contexts.
 */

// Ordered array of DifficultyLabels, indexof(label) + 1 == DifficultyValue equivalent
export const DifficultyLabels = [ 'easy', 'medium', 'difficult', 'challenging', 'extreme' ];
export const MinDifficultyValue = 1;
export const MaxDifficultyValue = DifficultyLabels.length;

export type DifficultyLabel = 'easy' | 'medium' | 'difficult' | 'challenging' | 'extreme';
export type DifficultyValue = 1 | 2 | 3 | 4 | 5;
export type Difficulty = DifficultyLabel | DifficultyValue;

/**
 * Typeguard for difficulty
 */
export const isDifficulty = (value: unknown): value is Difficulty => {
  return isDifficultyLabel(value) || isDifficultyValue(value);
}

/**
 * Typeguard for DifficultyValue
 */
export const isDifficultyLabel = (value: unknown): value is DifficultyLabel => {
  return typeof value === 'string' && DifficultyLabels.indexOf(value) >= 0
};

/**
 * Typegaurd for DifficultyLabel
 */
export const isDifficultyValue = (value: unknown): value is DifficultyValue => {
  return typeof value === 'number' && value >= MinDifficultyValue && value <= MaxDifficultyValue;
}

/**
 * Convert Difficulty to DifficultyValue
 */
export const getDifficultyValue = (value: Difficulty): number => {
  if (isDifficultyValue(value)) return value;
  else return DifficultyLabels.indexOf(value) + 1;
};
