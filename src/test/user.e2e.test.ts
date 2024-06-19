/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import App from "../App";
import express from "express";
import mongoose, { Mongoose } from "mongoose";

describe('e2e create user & login', () => {
  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const user = {
    accessToken: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

  beforeAll(async () => {
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    app = await App(mongooseClient);
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('can create test user (POST /v1/user)', async () => {
    const res = await supertest(app).post('/v1/user').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('access_token');
  });

  test('can basic auth test user (GET /v1/auth)', async () => {
    const res = await supertest(app).get('/v1/auth').send().set('Authorization', `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('can simple auth test user with username (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('can simple auth test user with email (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    user.accessToken = res.body.access_token;
  });

  test('can get user information (GET /v1/user)', async () => {
    const res = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('created');
    expect(res.body.username).toBe(user.username);
    expect(res.body.email).toBe(user.email);
  });

  test('can change username (/v1/user)', async () => {
    const res = await supertest(app).patch('/v1/user').send({ username: 'test user 2'}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.statusCode).toBe(200);
    expect(get.body).toHaveProperty('id');
    expect(get.body).toHaveProperty('username');
    expect(get.body).toHaveProperty('email');
    expect(get.body).toHaveProperty('created');
    expect(get.body.username).toBe('test user 2');
    expect(get.body.email).toBe(user.email);
    user.username = get.body.username;
  });

  test('can change email (PATCH /v1/user)', async () => {
    const res = await supertest(app).patch('/v1/user').send({ email: 'testuser2@example.com'}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.statusCode).toBe(200);
    expect(get.body).toHaveProperty('id');
    expect(get.body).toHaveProperty('username');
    expect(get.body).toHaveProperty('email');
    expect(get.body).toHaveProperty('created');
    expect(get.body.username).toBe(user.username);
    expect(get.body.email).toBe('testuser2@example.com');
    user.email = get.body.email;
  });

  test('can change password (PATCH /v1/user)', async () => {
    const newPassword = 'test user 2 password';
    const res = await supertest(app).patch('/v1/user').send({ password: newPassword}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);
    user.password = newPassword;
  });

  test('can basic auth with new password (GET /v1/auth)', async () => {
    const res = await supertest(app).get('/v1/auth').send().set('Authorization', `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('can simple auth test user with new username (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('can simple auth test user with new email (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    user.accessToken = res.body.access_token;
  });

  test('can get user information with new access token from new password (GET /v1/user)', async () => {
    const res = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('created');
    expect(res.body.username).toBe(user.username);
    expect(res.body.email).toBe(user.email);
  });
});