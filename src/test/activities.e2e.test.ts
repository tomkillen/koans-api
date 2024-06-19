import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import App from "../App";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import { GetActivityResponseDTO } from "../services/activity/activity.service";

describe('e2e activities', () => {
  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const user = {
    accessToken: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

  const activities: GetActivityResponseDTO[] = [];

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

  test('can list activities (GET /v1/activities)', async () => {
    const res = await supertest(app).get('/v1/activities').query({ page: 1, pageSize: 100 }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('page');
    expect(res.body.page).toBe(1);
    expect(res.body).toHaveProperty('pageSize');
    expect(res.body.pageSize).toBe(100);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('activities');
    expect(res.body.activities).toBeInstanceOf(Array);
    (res.body.activities as []).forEach(item => {
      expect(item).toBeDefined();
      expect(typeof item).toBe('object');
      expect(item).toHaveProperty('id');
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

  test('can get each activity (/v1/activities/{id}', async () => {
    await Promise.all(activities.map(async activity => {
      const res = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
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
});