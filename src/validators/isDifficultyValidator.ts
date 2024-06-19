import { Difficulty, isDifficultyLabel, isDifficultyValue } from "../services/activity/activity.difficulty";

/**
 * Custom express-validation validator to check if the provided value
 * is a valid difficulty value
 */
const isDifficultyValidator = (value: string): Difficulty => {
  if (isDifficultyLabel(value)) {
    return value;
  }
  const asInt = parseInt(value);
  if (isDifficultyValue(asInt)) {
    return asInt;
  }

  throw new Error(`Value is not a difficulty`);
}

export default isDifficultyValidator;