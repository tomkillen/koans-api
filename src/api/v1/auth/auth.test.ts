/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import App from "../../../App";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import Role from "../../../services/auth/auth.roles";

describe('/v1/auth', () => {

  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const user = {
    id: '',
    accessToken: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

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
    user.id = await app.userService.createUser({ 
      username: user.username, 
      email: user.email,
      password: user.password,
    });
    user.accessToken = await app.authService.getAuthTokenForUser(user.id, user.password);
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('GET /v1/auth => 200: can basic auth', async () => {
    const res = await supertest(app).get('/v1/auth').send().set('Authorization', `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });
  test('GET POST /v1/auth => 200: can post credentials', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      username: user.username,
      password: user.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });
  test('GET POST /v1/auth => 401: missing credentials', async () => {
    const res = await supertest(app).post('/v1/auth').send();
    expect(res.statusCode).toBe(401);
  });
  test('GET POST /v1/auth => 401: missing username & email', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      password: user.password,
    });
    expect(res.statusCode).toBe(401);
  });
  test('GET POST /v1/auth => 401: missing password with username', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      username: user.username,
    });
    expect(res.statusCode).toBe(401);
  });
  test('GET POST /v1/auth => 401: missing password with email', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      email: user.email,
    });
    expect(res.statusCode).toBe(401);
  });
  test('GET /v1/auth => 401: incorrect username', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      username: 'not my username',
      password: user.password,
    });
    expect(res.statusCode).toBe(401);
  });
  test('GET /v1/auth => 401: incorrect password', async () => {
    const res = await supertest(app).post('/v1/auth').send({
      username: user.username,
      password: 'not my password',
    });
    expect(res.statusCode).toBe(401);
  });
  test('GET /v1/auth => 401: no basic auth', async () => {
    const res = await supertest(app).get('/v1/auth').send();
    expect(res.statusCode).toBe(401);
  });
});