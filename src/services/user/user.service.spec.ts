/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose, { Mongoose } from "mongoose";
import UserService, { CreateUserRequestDTO } from "./user.service";

describe('user service', () => {
  let mongooseClient: Mongoose | null = null;  
  let userService: UserService | null = null;

  beforeAll(async () => {
    // @shelf/jest-mongodb creates an in-memory mongo instance and injects the URI
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    userService = new UserService(mongooseClient);
    await userService.prepare();
  });

  afterAll(async () => {
    try {
      await mongooseClient?.disconnect();
    } finally {
      userService = null;
    }
  });

  describe('create user', () => {
    test('can create valid new user', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const bobId = await userService!.createUser({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');

      // ensure we can get bob back again using his id
      // and that his details match
      const getBobAgain = await userService!.getUser(bobId);
      expect(getBobAgain).toBeDefined();
      expect(getBobAgain?.username).toBe('bob');
      expect(getBobAgain?.email).toBe('bob@example.com');

      // ensure we can authenticate with bob using his password
      const getBobWithPassword = await userService!.getUserCheckPassword({
        username: 'bob',
      }, 'password');
      expect(getBobWithPassword).toBeDefined();
      expect(getBobWithPassword?.username).toBe('bob');
      expect(getBobWithPassword?.email).toBe('bob@example.com');

      // ensure using the incorrect password fails
      // and we don't get bob if we use the wrong password
      expect(userService!.getUserCheckPassword({
        username: 'bob',
      }, 'incorrect password')).rejects.toThrowError();
    });

    test('users cannot be empty', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: '',
        email: '',
        password: ''
      })).rejects.toThrowError();
    });

    test('users cannot be null', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser(null as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be undefined', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser(undefined as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be a string', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser('invalid data type' as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('usernames can include all kinds of weird characters, because why not', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'asodmate12 4121 12!! %%% &()! ',
        email: 'strange_person@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can be chinese', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: '跑表上还剩五十八秒',
        email: 'chineseperson@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can include spaces', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const bobId = await userService!.createUser({
        username: 'bob the builder',
        email: 'bobthebuilder@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames can include capitals', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const bobId = await userService!.createUser({
        username: 'Bob Smith',
        email: 'bobsmith@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames are rejected if they differ by capitalization only', async () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'bob smith',
        email: 'bobsmithlowercase@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails are rejected if they only differ by capitalization', async () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'Bob Smith',
        email: 'BOBSMITH@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails must be valid (1)', async () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'Bob Smith',
        email: 'notan email',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails must be valid (2)', async () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'Bob Smith',
        email: 'notan@an@email.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails must be valid (3)', async () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'Bob Smith',
        email: 'notan @email.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require a username', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: '',
        email: 'invalid@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an email', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'invalid_user1',
        email: '',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an password', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.createUser({
        username: 'invalid_user2',
        email: 'invalid2@example.com',
        password: ''
      })).rejects.toThrowError();
    });
  });

  describe('delete user', () => {
    test('we can delete a user by id', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const deleteId = await userService!.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      await userService!.deleteUser(deleteId);
    });

    test('we can delete a user by email', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const deleteId = await userService!.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      await userService!.deleteUser({ email: 'willbedeleted@example.com' });
    });

    test('we can delete a user by username', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const deleteId = await userService!.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      await userService!.deleteUser({ username: 'Will Be Deleted' });
    });

    test('we cannot delete unknown users', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser('doesnt exist')).rejects.toThrowError();
    });

    test('we cannot delete empty ids', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser('')).rejects.toThrowError();
    });

    test('we cannot delete empty emails', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser({ email: '' })).rejects.toThrowError();
    });

    test('we cannot delete empty usernames', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser({ username: '' })).rejects.toThrowError();
    });

    test('we cannot delete null ids', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser(null as any as string)).rejects.toThrowError();
    });

    test('we cannot delete undefined ids', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser(undefined as any as string)).rejects.toThrowError();
    });

    test('we cannot delete ids that are objects', () => {
      expect(userService).toBeInstanceOf(UserService);
      expect(userService!.deleteUser({} as any as string)).rejects.toThrowError();
    });

    test('we cannot inject malicious code into deletions', async () => {
      expect(userService).toBeInstanceOf(UserService);
      const id1 = await userService!.createUser({
        username: 'Wont Be Deleted 1',
        email: 'willbedeleted1@example.com',
        password: 'password'
      });
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');

      const id2 = await userService!.createUser({
        username: 'Wont Be Deleted 2',
        email: 'Wontbedeleted2@example.com',
        password: 'password'
      });
      expect(id2).toBeDefined();
      expect(typeof id2).toBe('string');

      const id3 = await userService!.createUser({
        username: 'Wont Be Deleted 3',
        email: 'Wontbedeleted3@example.com',
        password: 'password'
      });
      expect(id3).toBeDefined();
      expect(typeof id3).toBe('string');

      expect(userService!.deleteUser(JSON.stringify({'_id':{'$in': [ id1, id2, id3 ] }}))).rejects.toThrowError();
    });
  });
});