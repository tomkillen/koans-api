/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import mongoose, { Mongoose } from "mongoose";
import UserService from "../user/user.service";
import AuthService from "./auth.service";
import { basicAuth, bearerAuth } from "./auth.middleware";
import supertest from "supertest";
import express from "express";
import Role from "./auth.roles";
import mockRequest from "../../test/mocks/mockRequest";
import mockResponse from "../../test/mocks/mockResponse";
import { JwtPayload, decode } from "jsonwebtoken";

describe('auth.middleware', () => {
  let mongooseClient: Mongoose = null!;  
  let userService: UserService = null!;
  let authService: AuthService = null!;

  beforeAll(async () => {
    // @shelf/jest-mongodb creates an in-memory mongo instance and injects the URI
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    userService = new UserService(mongooseClient);
    await userService.prepare();
    authService = new AuthService({
      jwt: {
        issuer: 'api.koans.example.com',
        audience: 'koans.example.com',
        secret: 'insecure string for testing purposes',
      },
      userService,
    });

    await userService!.createUser({
      username: 'user1',
      password: 'user1password',
      email: 'user1@example.com',
    });
  });

  afterAll(async () => {
    try {
      await mongooseClient?.disconnect();
    } finally {
      userService = null!;
      authService = null!;
    }
  });

  // Regular auth
  describe('regular user auth', () => {
    test('e2e can authorize using basic auth', async () => {
      const app = express();
      app.userService = userService!;
      app.authService = authService!;
      app.use(
        '/test',
        basicAuth,
        (_, res) => {
          expect(res.locals.accessToken).toBeDefined();
          res.status(200).end();
        },
      );
      const agent = supertest.agent(app);
      await agent.get('/test')
        .set('Authorization', `Basic ${Buffer.from('user1:user1password').toString('base64')}`);
    });
  
    test('e2e mpty auth fails', async () => {
      const app = express();
      app.userService = userService!;
      app.authService = authService!;
      app.use(
        '/test',
        basicAuth,
        (_, res) => {
          expect(res.locals.accessToken).toBeUndefined();
          res.status(200).end();
        },
      );
      const agent = supertest.agent(app);
      await agent.get('/test')
        .set('Authorization', `Basic `);
    });
  
    test('e2e incorrect password fails', async () => {
      const app = express();
      app.userService = userService!;
      app.authService = authService!;
      app.use(
        '/test',
        basicAuth,
        (_, res) => {
          expect(res.locals.accessToken).toBeUndefined();
          res.status(200).end();
        },
      );
      const agent = supertest.agent(app);
      await agent.get('/test')
        .set('Authorization', `Basic ${Buffer.from('user1:wrongpassword').toString('base64')}`);
    });
  });

  // Admin auth
  describe('admin user auth', () => {
    const regularUser = {
      id: '',
      accessToken: '',
      username: 'regular user',
      password: 'regular user',
      email: 'regularuser@example.com',
    };

    const adminUser = {
      id: '',
      accessToken: '',
      username: 'admin user',
      password: 'admin user password',
      email: 'adminuser@admins.zone',
      roles: [ 'admin' ] as Role[],
    }

    test('can create non-admin user', async () => {
      regularUser.id = await userService.createUser(regularUser);
      expect(regularUser.id).toBeObjectIdHexString();
    });

    test('can create admin user', async () => {
      adminUser.id = await userService.createUser(adminUser);
      expect(adminUser.id).toBeObjectIdHexString();
    });

    test('regular user can login as non-admin (basic auth)', async () => {
      const req = mockRequest({
        headers: {
          'authorization': `Basic ${Buffer.from(`${regularUser.username}:${regularUser.password}`).toString('base64')}`
        },
        app: {
          authService,
        },
      });
      const res = mockResponse({
      });
      const next = jest.fn();
      await basicAuth(req, res, next);
      expect(res.locals.accessToken).toBeJwt();
      expect(next).toHaveBeenCalledTimes(1);
      expect(decode(res.locals.accessToken!)).not.toHaveProperty('roles');
      regularUser.accessToken = res.locals.accessToken as string;
    });

    test('admin user can login (basic auth)', async () => {
      const req = mockRequest({
        headers: {
          'authorization': `Basic ${Buffer.from(`${adminUser.username}:${adminUser.password}`).toString('base64')}`
        },
        app: {
          authService,
        },
      });
      const res = mockResponse({
      });
      const next = jest.fn();
      await basicAuth(req, res, next);
      expect(res.locals.accessToken).toBeJwt();
      expect(decode(res.locals.accessToken!)).toHaveProperty('roles');
      expect((decode(res.locals.accessToken!) as JwtPayload).roles).toStrictEqual([ 'admin' ]);
      expect(next).toHaveBeenCalledTimes(1);
      adminUser.accessToken = res.locals.accessToken as string;
    });

    test('regular user can authorize as non-admin (bearer auth)', async () => {
      expect(regularUser.accessToken).toBeJwt();
      const req = mockRequest({
        headers: {
          'authorization': `Bearer ${regularUser.accessToken}`
        },
        app: {
          authService,
          userService,
        },
      });
      const res = mockResponse({
      });
      const next = jest.fn();
      await bearerAuth(req, res, next);
      expect(res.locals.user).toBeDefined();
      expect(res.locals.user).toHaveProperty('id');
      expect(res.locals.user).toHaveProperty('username');
      expect(res.locals.user).toHaveProperty('email');
      expect(res.locals.user).not.toHaveProperty('password');
      expect(res.locals.user?.roles).not.toBeDefined();
      expect(res.locals.user?.username).toBe(regularUser.username);
      expect(res.locals.user?.email).toBe(regularUser.email);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
      regularUser.id = res.locals.user?.id!;
      console.log('regular user', regularUser.accessToken);
    });

    test('admin user cannot authorize as admin (bearer auth)', async () => {
      expect(adminUser.accessToken).toBeJwt();
      const req = mockRequest({
        headers: {
          'authorization': `Bearer ${adminUser.accessToken}`
        },
        app: {
          authService,
          userService,
        },
      });
      const res = mockResponse({
      });
      const next = jest.fn();
      await bearerAuth(req, res, next);
      expect(res.locals.user).toBeDefined();
      expect(res.locals.user).toHaveProperty('id');
      expect(res.locals.user).toHaveProperty('username');
      expect(res.locals.user).toHaveProperty('email');
      expect(res.locals.user).not.toHaveProperty('password');
      expect(res.locals.user).toHaveProperty('roles');
      expect(res.locals.user?.roles).toStrictEqual([ 'admin' ]);
      expect(res.locals.user?.username).toBe(adminUser.username);
      expect(res.locals.user?.email).toBe(adminUser.email);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
      console.log('admin user', adminUser.accessToken);
      adminUser.id = res.locals.user?.id!;
    });
  });
});