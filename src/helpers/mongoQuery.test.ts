import { describe, expect, test } from "@jest/globals";
import { numberOrRangeToNumberFilter, sortOrder, textSearchFromSearchString, textSearchFromSearchTerms } from "./mongoQuery";

describe('test sortOrder', () => {
  test('asc is 1', () => {
    expect(sortOrder('asc')).toBe(1);
  });
  test('ascending is 1', () => {
    expect(sortOrder('ascending')).toBe(1);
  });
  test('desc is 1', () => {
    expect(sortOrder('desc')).toBe(-1);
  });
  test('descending is 1', () => {
    expect(sortOrder('descending')).toBe(-1);
  });
});

describe('test textSearchFromSearchTerms', () => {
  test(`test '"my" "best" "friends"'`, () => {
    expect(textSearchFromSearchTerms([ 'my', 'best', 'friends' ])).toStrictEqual({ $search: '"my" "best" "friends"' });
  });
  test(`test '"best" "friends"'`, () => {
    expect(textSearchFromSearchTerms([ '', 'best', 'friends' ])).toStrictEqual({ $search: '"best" "friends"' });
  });
  test(`escaping quotes`, () => {
    expect(textSearchFromSearchTerms([ '', '"best"', 'friends' ])).toStrictEqual({ $search: '"\"best\"" "friends"' });
  });
});

describe('test textSearchFromSearchString', () => {
  test(`test 'my best friends'`, () => {
    expect(textSearchFromSearchString('my best friends')).toStrictEqual({ $search: '"my" "best" "friends"' });
  });
  test(`test 'my      best    friends'`, () => {
    expect(textSearchFromSearchString('my      best    friends')).toStrictEqual({ $search: '"my" "best" "friends"' });
  });
  test(`test 'my "best friends"'`, () => {
    expect(textSearchFromSearchString('my "best friends"')).toStrictEqual({ $search: '"my" "best friends"' });
  });
  test(`test 'my "best friends'`, () => {
    expect(textSearchFromSearchString('my "best friends"')).toStrictEqual({ $search: '"my" "best friends"' });
  });
});

describe('test numberOrRangeToNumberFilter', () => {
  test('number', () => {
    expect(numberOrRangeToNumberFilter(5)).toStrictEqual({ $eq: 5 })
  });
  test('min', () => {
    expect(numberOrRangeToNumberFilter({ min: 5 })).toStrictEqual({ $gte: 5 })
  });
  test('max', () => {
    expect(numberOrRangeToNumberFilter({ max: 5 })).toStrictEqual({ $lte: 5 })
  });
  test('min & max', () => {
    expect(numberOrRangeToNumberFilter({ min: 1, max: 5 })).toStrictEqual({ $gte: 1, $lte: 5 })
  });
});
