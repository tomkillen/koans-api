import { expect, afterEach, beforeEach, describe, jest, test } from "@jest/globals";
import createConfig from "./createConfig";

describe('test config/createConfig', () => {
  // createConfig reads from process.env so this is a workaround method of mocking it
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });
  
  afterEach(() => {
    process.env = env;
  });

  test('recognizes developmentMode', () => {
    process.env.NODE_ENV = 'development'
    const config = createConfig();
    expect(config.developmentMode).toBe(true);
  });

  test('recognizes production mode', () => {
    process.env.NODE_ENV = 'production'
    const config = createConfig();
    expect(config.developmentMode).toBe(false);
  });

  test('defaults to production mode when NODE_ENV is invalid', () => {
    process.env.NODE_ENV = 'invalid value'
    const config = createConfig();
    expect(config.developmentMode).toBe(false);
  });

  test('defaults to production mode when NODE_ENV is missing', () => {
    process.env.NODE_ENV = undefined;
    const config = createConfig();
    expect(config.developmentMode).toBe(false);
  });

  test('detects port 80', () => {
    process.env.KOANS_PORT = '80'
    const config = createConfig();
    expect(config.port).toBe(80);
  });

  test('detects port 443', () => {
    process.env.KOANS_PORT = '443'
    const config = createConfig();
    expect(config.port).toBe(443);
  });

  test('detects port 3000', () => {
    process.env.KOANS_PORT = '3000'
    const config = createConfig();
    expect(config.port).toBe(3000);
  });

  test('defaults to port 3000', () => {
    process.env.KOANS_PORT = undefined
    const config = createConfig();
    expect(config.port).toBe(3000);
  });

  test('throws when port is not valid', () => {
    process.env.KOANS_PORT = 'invalid'
    expect(() => createConfig()).toThrow(Error);
  });

  test('throws when port is negative', () => {
    process.env.KOANS_PORT = '-1'
    expect(() => createConfig()).toThrow(Error);
  });

  test('throws when port is 0', () => {
    process.env.KOANS_PORT = '0'
    expect(() => createConfig()).toThrow(Error);
  });

  test('throws when port is too high', () => {
    process.env.KOANS_PORT = '90000'
    expect(() => createConfig()).toThrow(Error);
  });

  test('throws when port is a massive number', () => {
    process.env.KOANS_PORT = '12312908710247912094571205970125907125097152'
    expect(() => createConfig()).toThrow(Error);
  });
});