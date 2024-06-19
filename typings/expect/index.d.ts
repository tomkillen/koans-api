// T is unused but we want to match the type signature of Matchers exactly
/* eslint-disable @typescript-eslint/no-unused-vars */

declare module 'expect' {
  interface AsymmetricMatchers {
    toBeObjectIdHexString(): void;
    toBeJwt(): void;
  }
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    toBeObjectIdHexString(): R;
    toBeJwt(): R;
  }
}

export {}