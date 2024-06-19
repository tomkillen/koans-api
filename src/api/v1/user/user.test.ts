/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import App from "../../../App";

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

  // POST /user
  test('POST /v1/user => 201: can create test user (POST /v1/user)', async () => {
    const res = await supertest(app).post('/v1/user').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
  });

  test('POST /v1/user => 201: can create test user (POST /v1/user)', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: 'friend',
      email: 'friend@email.com',
      password: 'friend'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
  });

  test('POST /v1/user => 401: cannot create user if already authorized', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: 'a valid username',
      email: 'validemail@example.com',
      password: 'also a valid password',
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(401);
  });

  test('POST /v1/user => 400: cannot without username', async () => {
    const res = await supertest(app).post('/v1/user').send({
      email: 'user2@example.com',
      password: 'user2',
    });
    expect(res.status).toBe(400);
  });

  test('POST /v1/user => 400: cannot without email', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: 'user3',
      password: 'user3',
    });
    expect(res.status).toBe(400);
  });

  test('POST /v1/user => 400: cannot with invalid email', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: 'user4',
      email: 'user4@example',
      password: 'user4',
    });
    expect(res.status).toBe(400);
  });

  test('POST /v1/user => 409: cannot create user with duplicate username', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: user.username,
      email: 'user5@example.com',
      password: 'user5',
    });
    expect(res.status).toBe(409);
  });

  test('POST /v1/user => 409: cannot create user with duplicate email', async () => {
    const res = await supertest(app).post('/v1/user').send({
      username: 'user 6',
      email: user.email,
      password: 'user6',
    });
    expect(res.status).toBe(409);
  });

  test('GET /v1/auth => 200: can basic auth test user (GET /v1/auth)', async () => {
    const res = await supertest(app).get('/v1/auth').send().set('Authorization', `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('POST /v1/auth => 200: can simple auth test user with username (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('POST /v1/auth => 200: can simple auth test user with email (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    user.accessToken = res.body.access_token;
  });

  // GET /user
  test('GET /v1/user => 200: can get user information (GET /v1/user)', async () => {
    const res = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('created');
    expect(res.body.username).toBe(user.username);
    expect(res.body.email).toBe(user.email);
  });

  test('GET /v1/user => 401: cannot get user without auth', async () => {
    const res = await supertest(app).get('/v1/user');
    expect(res.statusCode).toBe(401);
  });

  // PATCH /user
  test('PATCH /v1/user => 204: can change username (/v1/user)', async () => {
    const res = await supertest(app).patch('/v1/user').send({ username: 'test user 2'}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get('/v1/user').set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.statusCode).toBe(200);
    expect(get.body).toHaveProperty('id');
    expect(get.body.id).toBeObjectIdHexString();
    expect(get.body).toHaveProperty('username');
    expect(get.body).toHaveProperty('email');
    expect(get.body).toHaveProperty('created');
    expect(get.body.username).toBe('test user 2');
    expect(get.body.email).toBe(user.email);
    user.username = get.body.username;
  });

  // PATCH /user
  test('PATCH /v1/user => 204: can change email (PATCH /v1/user)', async () => {
    const res = await supertest(app).patch('/v1/user').send({ email: 'testuser2@example.com'}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.statusCode).toBe(200);
    expect(get.body).toHaveProperty('id');
    expect(get.body.id).toBeObjectIdHexString();
    expect(get.body).toHaveProperty('username');
    expect(get.body).toHaveProperty('email');
    expect(get.body).toHaveProperty('created');
    expect(get.body.username).toBe(user.username);
    expect(get.body.email).toBe('testuser2@example.com');
    user.email = get.body.email;
  });

  // PATCH /user
  test('PATCH /v1/user => 204: can change password (PATCH /v1/user)', async () => {
    const newPassword = 'test user 2 password';
    const res = await supertest(app).patch('/v1/user').send({ password: newPassword}).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);
    user.password = newPassword;
  });

  test('GET /v1/auth => 200: can basic auth with new password (GET /v1/auth)', async () => {
    const res = await supertest(app).get('/v1/auth').send().set('Authorization', `Basic ${Buffer.from(`${user.username}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('POST /v1/auth => 200: can simple auth test user with new username (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });

  test('POST /v1/auth => 200: can simple auth test user with new email (POST /v1/auth)', async () => {
    const res = await supertest(app).post('/v1/auth').send({ username: user.username, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    user.accessToken = res.body.access_token;
  });

  // GET /user
  // 200: OK
  test('GET /v1/user => 200: can get user information with new access token from new password (GET /v1/user)', async () => {
    const res = await supertest(app).get('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('created');
    expect(res.body.username).toBe(user.username);
    expect(res.body.email).toBe(user.email);
  });

  test('PATCH /v1/user => 400: cannot patch user without data', async () => {
    const res = await supertest(app).patch('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(400);
  });
  test('PATCH /v1/user => 400: cannot patch user with invalid email', async () => {
    const res = await supertest(app).patch('/v1/user').send({
      email: 'notvalid@some com',
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(400);
  });
  test('PATCH /v1/user => 400: cannot patch user with empty password', async () => {
    const res = await supertest(app).patch('/v1/user').send({
      password: '',
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(400);
  });
  test('PATCH /v1/user => 400: cannot patch user with empty username', async () => {
    const res = await supertest(app).patch('/v1/user').send({
      username: '',
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.status).toBe(400);
  });
  test('PATCH /v1/user => 401: cannot patch user without auth', async () => {
    const res = await supertest(app).patch('/v1/user').send({
      username: 'user A',
    });
    expect(res.status).toBe(401);
  });
  test('PATCH /v1/user => 409: cannot patch user with duplicate username', async () => {
    expect(user.accessToken).toBeJwt();
    const res = await supertest(app).patch('/v1/user').send({
      username: 'friend',
    }).set('Authorization', `Bearer ${user.accessToken}`);;
    expect(res.statusCode).toBe(409);
  });
  test('PATCH /v1/user => 409: cannot patch user with duplicate email', async () => {
    expect(user.accessToken).toBeJwt();
    const res = await supertest(app).patch('/v1/user').send({
      email: 'friend@email.com',
    }).set('Authorization', `Bearer ${user.accessToken}`);;
    expect(res.statusCode).toBe(409);
  });

  test('DELETE /v1/user => 401: cant delete user without auth', async () => {
    const res = await supertest(app).delete('/v1/user').send();
    expect(res.statusCode).toBe(401);
  });

  test('DELETE /v1/user => 204: can delete user', async () => {
    const res = await supertest(app).delete('/v1/user').send().set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);
  });
});