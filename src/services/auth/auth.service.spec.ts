import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose, { Mongoose } from "mongoose";
import UserService from "../user/user.service";
import AuthService from "./auth.service";

describe('auth.service', () => {
  let mongooseClient: Mongoose | null = null;  
  let userService: UserService | null = null;
  let authService: AuthService | null = null;

  let validUser: any = {
    id: undefined,
    username: 'user1',
    email: 'user1@example.com',
    password: 'password',
  };

  const invalidUser = {
    id: 'asdad',
    username: 'doesnt exist',
    email: 'doesntexist@example.com',
    password: 'not a correct password',
  };

  beforeAll(async () => {
    // @shelf/jest-mongodb creates an in-memory mongo instance and injects the URI
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    userService = new UserService(mongooseClient);
    await userService.prepare();
    authService = new AuthService({
      jwt: {
        issuer: 'api.koans.example.com',
        audience: 'koans.example.com',
        secretOrKey: 'insecure string for testing purposes',
      },
      userService,
    });

    delete validUser.id;
    validUser.id = await userService!.createUser(validUser);
  });

  afterAll(async () => {
    try {
      await mongooseClient?.disconnect();
    } finally {
      userService = null;
      delete validUser.id;
    }
  });


  // Valid user, successful paths

  test('can authorize valid user using id and password', async () => {
    expect(authService).toBeDefined();
    const token = await authService!.getAuthTokenForUser(validUser.id, validUser.password);
    expect(token).toBeDefined();
  });

  test('can authorize valid user using username and password', async () => {
    expect(authService).toBeDefined();
    const token = await authService!.getAuthTokenForUser({ username: validUser.username }, validUser.password);
    expect(token).toBeDefined();
  });

  test('can authorize valid user using email and password', async () => {
    expect(authService).toBeDefined();
    const token = await authService!.getAuthTokenForUser({ email: validUser.email }, validUser.password);
    expect(token).toBeDefined();
  });

  // Valid user, unsuccessful paths

  test('cannot authorize valid user using id and wrong password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser(validUser.id, 'wrong password')).rejects.toThrowError();
  });

  test('cannot authorize valid user using username and wrong password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ username: validUser.username }, 'wrong password')).rejects.toThrowError();
  });

  test('cannot authorize valid user using email and wrong password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ email: validUser.email }, 'wrong password')).rejects.toThrowError();
  });

  test('cannot authorize valid user using id and null password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser(validUser.id, null as any as string)).rejects.toThrowError();
  });

  test('cannot authorize valid user using username and null password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ username: validUser.username }, null as any as string)).rejects.toThrowError();
  });

  test('cannot authorize valid user using email and null password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ email: validUser.email }, null as any as string)).rejects.toThrowError();
  });


  // Invalid user, cannot authorize

  test('cannot authorize invalid user using id and password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser(invalidUser.id, invalidUser.password)).rejects.toThrowError();
  });

  test('cannot authorize invalid user using username and password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ username: invalidUser.username }, invalidUser.password)).rejects.toThrowError();
  });

  test('cannot authorize invalid user using email and password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ email: invalidUser.email }, invalidUser.password)).rejects.toThrowError();
  });

  // Invalid user, valid password, cannot authorize

  test('cannot authorize invalid user using id and valid password for other user', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser(invalidUser.id, validUser.password)).rejects.toThrowError();
  });

  test('cannot authorize invalid user using username and valid password for other user', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ username: validUser.username }, validUser.password)).rejects.toThrowError();
  });

  test('cannot authorize invalid user using email and valid password for other user', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser({ email: validUser.email }, validUser.password)).rejects.toThrowError();
  });

  // No user auth, cannot authorize

  test('cannot authorize invalid user using id and password', async () => {
    expect(authService).toBeDefined();
    expect(authService!.getAuthTokenForUser('', '')).rejects.toThrowError();
  });
});