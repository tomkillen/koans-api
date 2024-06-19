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