import { expect } from '@jest/globals';
import toBeObjectId from './matchers/toBeObjectId';

expect.extend({
  toBeObjectId,
});