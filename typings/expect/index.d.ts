import { expect } from "@jest/globals";

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeObjectId(): void;
  }
  interface Matchers<R> {
    toBeObjectId(): R;
  }
}

export {}