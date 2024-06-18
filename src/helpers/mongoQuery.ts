/**
 * Helpers & types for constructing mongo queries & filters
 */

import { SortOrder } from "mongoose";

/**
 * Defines a filter that is either equal to a value or within a range of min/max (inclusive)
 */
export type NumberOrRange = number | { min: number } | { max: number } | { min: number, max: number };

export type Eq<T> = { $eq: T };
export type Lte<T> = { $lte: T };
export type Gte<T> = { $gte: T };
export type In<T> = { $in: T[] };
export type NumberFilter = Eq<number> | Lte<number> | Gte<number> | (Lte<number> & Gte<number>);
export type StringFilter = Eq<string> | In<string>;
export type TextSearch = { $search: string };
export type Sort<T> = { [K in keyof Partial<T>]: SortOrder };

/**
 * Convert SortOrder to a simple 1 or -1
 */
export const sortOrder = (sortOrder: SortOrder): 1 | -1 => 
  (
    sortOrder === 'asc' ||
    sortOrder === 'ascending' ||
    sortOrder === 1
  ) ? 1 : -1;

/** 
 * Compiles an array of search terms into a TextSearch that will match 
 * each searchTerm using an AND operation 
 * @example [ 'my', 'best', 'friends' ] => { $search: '"my" "best" "friends"' }
 */
export const textSearchFromSearchTerms = (searchTerms: string[]): TextSearch => 
  ({ $search: searchTerms.filter(searchTerm => searchTerm.trim()).map(searchTerm => `"${searchTerm}"`).join(' ') });

const SplitStringBySpacesPreserveQuotesRegex = /"([^"]*)"|(\S+)/g;

/** 
 * Compile a search string into a TextSearch
 * @example `Hello world` => { $search: '"hello" "world"' }
 * @example `"Hello world"` => { $search: '"hello world"' }
 * @example `"Hello world" cheese"` => { $search: '"hello world" "cheese"' }
 */
export const textSearchFromSearchString = (str: string): TextSearch => 
  textSearchFromSearchTerms(
    // Split string by spaces but preserve quoted strings
    (str.match(SplitStringBySpacesPreserveQuotesRegex) || [])
      .map(
        substr => substr.trim().replace(SplitStringBySpacesPreserveQuotesRegex, '$1$2')
      )
  );

/**
 * Converts a NumberOrRange to a NumberFilter
 * @example `5` => { $eq: 5 }
 * @example { min: 1 } => { $gte: 1 }
 * @example { max: 5 } => { $lte: 5 }
 * @example { min: 1, max: 5 } => { $gte: 1, $lte: 5 } 
 */
export const numberOrRangeToNumberFilter = (numberOrRange: NumberOrRange): NumberFilter => {
  if (typeof numberOrRange === 'number') {
    return { $eq: numberOrRange };
  } else {
    if ('min' in numberOrRange && 'max' in numberOrRange) {
      return { $gte: numberOrRange.min, $lte: numberOrRange.max };
    } else if ('min' in numberOrRange) {
      return { $gte: numberOrRange.min };
    } else {
      return { $lte: numberOrRange.max };
    }
  }
}