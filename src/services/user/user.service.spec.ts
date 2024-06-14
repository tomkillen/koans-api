import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { MongoClient, Db } from 'mongodb';
import UsersService, { CreateUserRequestDTO } from "./user.service";

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
      const bobId = await UsersService.createUser({
        username: 'bob',
        email: 'bob@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('users cannot be empty', () => {
      expect(UsersService.createUser({
        username: '',
        email: '',
        password: ''
      })).rejects.toThrowError();
    });

    test('users cannot be null', () => {
      expect(UsersService.createUser(null as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be undefined', () => {
      expect(UsersService.createUser(undefined as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('users cannot be a string', () => {
      expect(UsersService.createUser('invalid data type' as any as CreateUserRequestDTO)).rejects.toThrowError();
    });

    test('usernames can include all kinds of weird characters, because why not', () => {
      expect(UsersService.createUser({
        username: 'asodmate12 4121 12!! %%% &()! ',
        email: 'strange_person@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can be chinese', () => {
      expect(UsersService.createUser({
        username: '跑表上还剩五十八秒',
        email: 'chineseperson@example.com',
        password: ''
      })).rejects.toThrowError();
    });

    test('usernames can include spaces', async () => {
      const bobId = await UsersService.createUser({
        username: 'bob the builder',
        email: 'bobthebuilder@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames can include capitals', async () => {
      const bobId = await UsersService.createUser({
        username: 'Bob Smith',
        email: 'bobsmith@example.com',
        password: 'password'
      });
      expect(bobId).toBeDefined();
      expect(typeof bobId).toBe('string');
    });

    test('usernames are rejected if they differ by capitalization only', async () => {
      expect(UsersService.createUser({
        username: 'bob smith',
        email: 'bobsmithlowercase@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('emails are rejected if they only differ by capitalization', async () => {
      expect(UsersService.createUser({
        username: 'Bob Smith',
        email: 'BOBSMITH@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require a username', () => {
      expect(UsersService.createUser({
        username: '',
        email: 'invalid@example.com',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an email', () => {
      expect(UsersService.createUser({
        username: 'invalid_user1',
        email: '',
        password: 'password'
      })).rejects.toThrowError();
    });

    test('users require an password', () => {
      expect(UsersService.createUser({
        username: 'invalid_user2',
        email: 'invalid2@example.com',
        password: ''
      })).rejects.toThrowError();
    });
  });

  describe('delete user', () => {
    test('we can delete a user by id', async () => {
      const deleteId = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UsersService.deleteUser({ id: deleteId })).resolves.toHaveBeenCalled();
    });

    test('we can delete a user by email', async () => {
      const deleteId = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UsersService.deleteUser({ email: 'willbedeleted@example.com' })).resolves.toHaveBeenCalled();
    });

    test('we can delete a user by username', async () => {
      const deleteId = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(deleteId).toBeDefined();
      expect(typeof deleteId).toBe('string');

      expect(UsersService.deleteUser({ username: 'Will Be Deleted' })).resolves.toHaveBeenCalled();
    });

    test('we cannot delete unknown users', () => {
      expect(UsersService.deleteUser({ id: 'doesnt exist' })).rejects.toThrowError();
    });

    test('we cannot delete empty ids', () => {
      expect(UsersService.deleteUser({ id: '' })).rejects.toThrowError();
    });

    test('we cannot delete empty emails', () => {
      expect(UsersService.deleteUser({ email: '' })).rejects.toThrowError();
    });

    test('we cannot delete empty usernames', () => {
      expect(UsersService.deleteUser({ username: '' })).rejects.toThrowError();
    });

    test('we cannot delete null ids', () => {
      expect(UsersService.deleteUser({ id: null as any as string })).rejects.toThrowError();
    });

    test('we cannot delete undefined ids', () => {
      expect(UsersService.deleteUser({ id: undefined as any as string })).rejects.toThrowError();
    });

    test('we cannot delete ids that are objects', () => {
      expect(UsersService.deleteUser({ id: {} as any as string })).rejects.toThrowError();
    });

    test('we cannot inject malicious code into deletions', async () => {
      const id1 = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');

      const id2 = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');

      const id3 = await UsersService.createUser({
        username: 'Will Be Deleted',
        email: 'willbedeleted@example.com',
        password: 'password'
      });
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');

      expect(UsersService.deleteUser({ id: JSON.stringify({'_id':{'$in': [ id1, id2, id3 ] }}) })).rejects.toThrowError();
    });
  });
});