import type {MatcherFunction} from 'expect';
import { decode } from 'jsonwebtoken';

/**
 * Expects the value to be a JWT string
 * Does not check if the signature is valid
 */
const toBeJwt: MatcherFunction<[]> = function (actual: unknown) {
  const pass = typeof actual === 'string' && decode(actual) !== null;
  return {
    pass,
    message: pass
      ? () => `expected ${this.utils.printReceived(actual)} to not be a jwt token`
      : () => `expected ${this.utils.printReceived(actual)} to be a jwt token`,
  };
};

export default toBeJwt;