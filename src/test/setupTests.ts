import { expect } from '@jest/globals';
import toBeObjectIdHexString from './matchers/toBeObjectIdHexString';
import toBeJwt from './matchers/toBeJwt';

expect.extend({
  toBeObjectIdHexString,
  toBeJwt,
});