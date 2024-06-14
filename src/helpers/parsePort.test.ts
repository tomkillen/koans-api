import {describe, expect, test} from '@jest/globals';
import parsePort from "./parsePort";

describe('helpers/parsePort', () => {
  test('expect 1 to be a valid port', () => {
    expect(parsePort("1")).toBe(1);
  });

  test('expect 65535 to be a valid port', () => {
    expect(parsePort("65535")).toBe(65535);
  });
  
  test('expect 80 to be a valid port', () => {
    expect(parsePort("80")).toBe(80);
  });

  test('expect 443 to be a valid port', () => {
    expect(parsePort("443")).toBe(443);
  });

  test('expect 3000 to be a valid port', () => {
    expect(parsePort("3000")).toBe(3000);
  });

  test('expect 0 to be invalid', () => {
    expect(() => parsePort("0")).toThrow(Error)
  });

  test('expect 65536 to be invalid', () => {
    expect(() => parsePort("65536")).toThrow(Error)
  });

  test('expect -1 to be invalid', () => {
    expect(() => parsePort("-1")).toThrow(Error)
  });

  test('expect "asd" to be invalid', () => {
    expect(() => parsePort("asd")).toThrow(Error)
  });

  test('throws when port is a massive number', () => {
    expect(() => parsePort("1239812740912740918274091274")).toThrow(Error)
  });
});