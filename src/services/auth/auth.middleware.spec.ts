/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose, { Mongoose, isValidObjectId } from "mongoose";
import UserService from "../user/user.service";
import AuthService from "./auth.service";
import { basicAuth } from "./auth.middleware";
import supertest from "supertest";
import express from "express";
import Role from "./auth.roles";

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
    test('can authorize using basic auth', async () => {
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
  
    test('empty auth fails', async () => {
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
  
    test('incorrect password fails', async () => {
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
      expect(regularUser.id).toBeObjectId();
    });

    test('can create admin user', async () => {
      adminUser.id = await userService.createUser(adminUser);
      expect(adminUser.id).toBeObjectId();
    });

    test('regular user cannot login as admin', async () => {

    });
  });
});