/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import App from "../../../App";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import Role from "../../../services/auth/auth.roles";

describe('e2e categories', () => {
  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const admin = {
    id: '',
    accessToken: '',
    username: 'test admin',
    email: 'testadmin@example.com',
    password: 'admin password',
    roles: [ 'admin' as Role ],
  };

  beforeAll(async () => {
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    app = await App(mongooseClient);
    admin.id = await app.userService.createUser({ 
      username: admin.username, 
      email: admin.email,
      password: admin.password,
      roles: admin.roles,
    });
    admin.accessToken = await app.authService.getAuthTokenForUser(admin.id, admin.password);
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('GET /v1/categories => 401: Not Authorized', async () => {
    const res = await supertest(app).get(`/v1/categories`);
    expect(res.statusCode).toBe(401);
  });

  test('GET /v1/categories => 200: Authorized', async () => {
    const res = await supertest(app).get(`/v1/categories`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBeGreaterThan(0);
    expect(typeof res.body.total).toBe('number');
    expect(Array.isArray(res.body.categories)).toBeTruthy();
    res.body.categories.forEach((category: any) => {
      expect(typeof category.name).toBe('string');
      expect(typeof category.count).toBe('number');
    });
  });
});