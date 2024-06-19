import type {MatcherFunction} from 'expect';

const objectIdHexRegexp = /^[0-9A-Fa-f]{24}$/;

/**
 * Expects the value to be a hex-string representation of a Mongo.ObjectId
 * @example 
 */
const toBeObjectIdHexString: MatcherFunction<[]> = function (actual: unknown) {
  const pass = typeof actual === 'string' && objectIdHexRegexp.test(actual);
  return {
    pass,
    message: pass
      ? () => `expected ${this.utils.printReceived(actual)} to not be an ObjectId hex string`
      : () => `expected ${this.utils.printReceived(actual)} to be an ObjectId hex string`,
  };
};

export default toBeObjectIdHexString;