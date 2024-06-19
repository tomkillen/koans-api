/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import App from "../../../App";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import { GetActivityResponseDTO } from "../../../services/activity/activity.service";
import Role from "../../../services/auth/auth.roles";

describe('e2e activities', () => {
  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const user = {
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

  const activities: GetActivityResponseDTO[] = [];

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

  test('POST /v1/user => 201: can create test user (POST /v1/user)', async () => {
    const res = await supertest(app).post('/v1/user').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
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

  test('GET /v1/activities => 200: can list activities (GET /v1/activities)', async () => {
    const res = await supertest(app).get('/v1/activities').query({ page: 1, pageSize: 100 }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page');
    expect(res.body.page).toBe(1);
    expect(res.body).toHaveProperty('pageSize');
    expect(res.body.pageSize).toBe(100);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('activities');
    expect(res.body.activities).toBeInstanceOf(Array);
    (res.body.activities as any[]).forEach(item => {
      expect(item).toBeDefined();
      expect(typeof item).toBe('object');
      expect(item).toHaveProperty('id');
      expect(item.id).toBeObjectIdHexString();
      expect(item).toHaveProperty('created');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('duration');
      expect(item).toHaveProperty('difficulty');
      expect(item).toHaveProperty('content');
    });

    const total: number = res.body.total;
    let page: number = 1;
    const pageSize: number = 10;
    while (activities.length < total) {
      const res = await supertest(app).get('/v1/activities').query({ page, pageSize }).set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('page');
      expect(res.body.page).toBe(page);
      expect(res.body).toHaveProperty('pageSize');
      expect(res.body.pageSize).toBe(pageSize);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('activities');
      expect(res.body.activities).toBeInstanceOf(Array);
      (res.body.activities as any[]).forEach(item => {
        expect(item).toBeDefined();
        expect(typeof item).toBe('object');
        expect(item).toHaveProperty('id');
        expect(item.id).toBeObjectIdHexString();
        expect(item).toHaveProperty('created');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('duration');
        expect(item).toHaveProperty('difficulty');
        expect(item).toHaveProperty('content');
        activities.push({ ...item });
      });
      page += 1;
    }
  }, 10000);

  test('GET /v1/activities/:id => 200: an get each activity (/v1/activities/{id}', async () => {
    await Promise.all(activities.map(async activity => {
      const res = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBeObjectIdHexString();
      expect(res.body.id).toBe(activity.id);
      expect(res.body).toHaveProperty('created');
      expect(res.body.created).toBe(activity.created);
      expect(res.body).toHaveProperty('title');
      expect(res.body.title).toBe(activity.title);
      expect(res.body).toHaveProperty('category');
      expect(res.body.category).toBe(activity.category);
      expect(res.body).toHaveProperty('description');
      expect(res.body.description).toBe(activity.description);
      expect(res.body).toHaveProperty('duration');
      expect(res.body.duration).toBe(activity.duration);
      expect(res.body).toHaveProperty('difficulty');
      expect(res.body.difficulty).toBe(activity.difficulty);
      expect(res.body).toHaveProperty('content');
      expect(res.body.content).toBe(activity.content);
    }));
  }, 10000);

  test('GET /v1/activities => 400: bad query', async () => {
    const res = await supertest(app).get(`/v1/activities`).query({
      difficulty: 'cheese',
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('GET /v1/activities => 401: missing auth', async () => {
    const res = await supertest(app).get(`/v1/activities`);
    expect(res.statusCode).toBe(401);
  });
  test('POST /v1/activities => 201: admin can create activity', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity',
      category: 'some test category',
      description: 'some test description',
      content: 'some test content',
      difficulty: 'easy',
      duration: 60,
    }).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).toBeObjectIdHexString();
  });
  test('POST /v1/activities => 400: missing activity data', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity 123',
      category: 'some test category 123',
    }).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('POST /v1/activities => 400: invalid activity data', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity 4',
      category: 'some test category',
      description: 'some test description',
      content: 'some test content',
      difficulty: 'cheese',
      duration: 60,
    }).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('POST /v1/activities => 401: missing auth', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity 5',
      category: 'some test category',
      description: 'some test description',
      content: 'some test content',
      difficulty: 'cheese',
      duration: 60,
    });
    expect(res.statusCode).toBe(401);
  });
  test('POST /v1/activities => 401: not an admin', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity 7',
      category: 'some test category',
      description: 'some test description',
      content: 'some test content',
      difficulty: 'cheese',
      duration: 60,
    }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(401);
  });
  test('POST /v1/activities => 409: duplicate title', async () => {
    const res = await supertest(app).post(`/v1/activities`).send({
      title: 'some test activity',
      category: 'some test category',
      description: 'some test description',
      content: 'some test content',
      difficulty: 'easy',
      duration: 60,
    }).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(409);
  });
});