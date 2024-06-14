import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { MongoClient, Db } from 'mongodb';
import UserService, { CreateUserRequestDTO } from "./user.service";

describe('user service', () => {
  let connection: MongoClient | null = null;
  let db: Db | null = null;

  beforeAll(async () => {
    connection = await MongoClient.connect((global as any).__MONGO_URI__ as string);
    db = await connection.db();
  });

  afterAll(async () => {
    await connection?.close();
  });

  describe('create user', () => {
    test('can create valid new user', async () => {
      const bobId = await UserService.createUser({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('users cannot be empty', () => {
      expect(UserService.createUser({
        username: '',
        email: '',
        password: ''
      })).rejects.toThrowError();
    });

    test('users cannot be null', () => {
      expect(UserService.createUser(null as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be undefined', () => {
      expect(UserService.createUser(undefined as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be a string', () => {
      expect(UserService.createUser('invalid data type' as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('usernames can include all kinds of weird characters, because why not', () => {
      expect(UserService.createUser({
        username: 'asodmate12 4121 12!! %%% &()! ',
        email: 'strange_person@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can be chinese', () => {
      expect(UserService.createUser({
        username: '跑表上还剩五十八秒',
        email: 'chineseperson@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can include spaces', async () => {
      const bobId = await UserService.createUser({
        username: 'bob the builder',
        email: 'bobthebuilder@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames can include capitals', async () => {
      const bobId = await UserService.createUser({
        username: 'Bob Smith',
        email: 'bobsmith@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames are rejected if they differ by capitalization only', async () => {
      expect(UserService.createUser({
        username: 'bob smith',
        email: 'bobsmithlowercase@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails are rejected if they only differ by capitalization', async () => {
      expect(UserService.createUser({
        username: 'Bob Smith',
        email: 'BOBSMITH@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require a username', () => {
      expect(UserService.createUser({
        username: '',
        email: 'invalid@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an email', () => {
      expect(UserService.createUser({
        username: 'invalid_user1',
        email: '',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an password', () => {
      expect(UserService.createUser({
        username: 'invalid_user2',
        email: 'invalid2@example.com',
        password: ''
      })).rejects.toThrowError();
    });
  });

  describe('delete user', () => {
    test('we can delete a user by id', async () => {
      const deleteId = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UserService.deleteUser({ id: deleteId })).resolves.toHaveBeenCalled();
    });

    test('we can delete a user by email', async () => {
      const deleteId = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UserService.deleteUser({ email: 'willbedeleted@example.com' })).resolves.toHaveBeenCalled();
    });

    test('we can delete a user by username', async () => {
      const deleteId = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UserService.deleteUser({ username: 'Will Be Deleted' })).resolves.toHaveBeenCalled();
    });

    test('we cannot delete unknown users', () => {
      expect(UserService.deleteUser({ id: 'doesnt exist' })).rejects.toThrowError();
    });

    test('we cannot delete empty ids', () => {
      expect(UserService.deleteUser({ id: '' })).rejects.toThrowError();
    });

    test('we cannot delete empty emails', () => {
      expect(UserService.deleteUser({ email: '' })).rejects.toThrowError();
    });

    test('we cannot delete empty usernames', () => {
      expect(UserService.deleteUser({ username: '' })).rejects.toThrowError();
    });

    test('we cannot delete null ids', () => {
      expect(UserService.deleteUser({ id: null as any as string })).rejects.toThrowError();
    });

    test('we cannot delete undefined ids', () => {
      expect(UserService.deleteUser({ id: undefined as any as string })).rejects.toThrowError();
    });

    test('we cannot delete ids that are objects', () => {
      expect(UserService.deleteUser({ id: {} as any as string })).rejects.toThrowError();
    });

    test('we cannot inject malicious code into deletions', async () => {
      const id1 = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');

      const id2 = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id2).toBeDefined();
      expect(typeof id2).toBe('string');

      const id3 = await UserService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id3).toBeDefined();
      expect(typeof id3).toBe('string');

      expect(UserService.deleteUser({ id: JSON.stringify({'_id':{'$in': [ id1, id2, id3 ] }}) })).rejects.toThrowError();
    });
  });
});