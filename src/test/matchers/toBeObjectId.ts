import { isValidObjectId } from "mongoose";
import type {MatcherFunction} from 'expect';

/**
 * Expects the value to be a MongoId or a value castable to a 
 */
const toBeObjectId: MatcherFunction = function (actual: unknown) {
  if (isValidObjectId(actual)) {
    return {
      message: () =>
        `expected ${this.utils.printReceived(actual)} to not be a valid ObjectId`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected ${this.utils.printReceived(actual)} to be a valid ObjectId`,
      pass: true,
    };
  }
};

export default toBeObjectId;