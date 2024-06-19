import { describe, test } from "@jest/globals";
import { Difficulty, DifficultyLabels, getDifficultyValue, isDifficulty } from "../services/activity/activity.difficulty";
import expect from "expect";
import isDifficultyValidator from "./isDifficultyValidator";

describe('test isDifficultyValidator', () => {
  DifficultyLabels.forEach((label, i) => {
    const value = i + 1;
    test(`${label} is a valid difficulty`, () => {
      expect(isDifficulty(label)).toBe(true);
    });
    test(`${label} validates as difficulty`, () => {
      expect(isDifficultyValidator(label)).toBe(label);
    });
    test(`${label} evaluates to difficulty value`, () => {
      expect(getDifficultyValue(label as Difficulty)).toBe(value);
    });
    test(`${value} is a valid difficulty`, () => {
      expect(isDifficulty(value)).toBe(true);
    });
    test(`${value} validates as difficulty`, () => {
      expect(isDifficultyValidator(value.toString())).toBe(value);
    });
    test(`${value} evaluates to difficulty value`, () => {
      expect(getDifficultyValue(value as Difficulty)).toBe(value);
    });
  });
});