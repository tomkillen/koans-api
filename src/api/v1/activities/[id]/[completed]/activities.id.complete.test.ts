/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import generateActivity from "../../../../../helpers/generateActivity";
import App from "../../../../../App";

describe('/v1/activities/:id/completed', () => {
  let mongooseClient: Mongoose | null = null;
  let app: express.Application = null!;

  const user = {
    id: '',
    accessToken: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

  const activity = {
    id: '',
    created: '',
    completed: false,
    ...generateActivity()
  };
  const anotherActivity = {
    id: '',
    created: '',
    completed: false,
    ...generateActivity()
  };

  beforeAll(async () => {
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    app = await App(mongooseClient);
    
    user.id = await app.userService.createUser({ 
      username: user.username, 
      email: user.email,
      password: user.password,
    });
    user.accessToken = await app.authService.getAuthTokenForUser(user.id, user.password);

    activity.id = await app.activityService.createActivity(activity);
    activity.created = (await app.activityService.getActivity(activity.id)).created.toISOString();
    
    anotherActivity.id = await app.activityService.createActivity(anotherActivity);
    anotherActivity.created = (await app.activityService.getActivity(anotherActivity.id)).created.toISOString();
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('PUT /activities/:id/completed => 204, mark activity completed', async () => {
    const res = await supertest(app).put(`/v1/activities/${activity.id}/completed`).send({ completed: true }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.body.completed).toBeTruthy();
  });

  test('PUT /activities/:id/completed => 409, activity already completed', async () => {
    const res = await supertest(app).put(`/v1/activities/${activity.id}/completed`).send({ completed: true }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(409);

    const get = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.body.completed).toBeTruthy();
  });

  test('PUT /activities/:id/completed => 409, activity already not completed', async () => {
    const res = await supertest(app).put(`/v1/activities/${anotherActivity.id}/completed`).send({ completed: false }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(409);

    const get = await supertest(app).get(`/v1/activities/${anotherActivity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.body.completed).not.toBeTruthy();
  });

  test('PUT /activities/:id/completed => 204, mark activity not completed', async () => {
    const res = await supertest(app).put(`/v1/activities/${activity.id}/completed`).send({ completed: false }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(204);

    const get = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${user.accessToken}`);
    expect(get.body.completed).not.toBeTruthy();
  });

  test('PUT /activities/:id/completed => 400, bad request', async () => {
    const res = await supertest(app).put(`/v1/activities/${activity.id}/completed`).send({ completed: 'done' }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('PUT /activities/:id/completed => 401, not authorized', async () => {
    const res = await supertest(app).put(`/v1/activities/${activity.id}/completed`).send({ completed: true });
    expect(res.statusCode).toBe(401);
  });

  test('PUT /activities/:id/completed => 404, not found', async () => {
    const res = await supertest(app).put(`/v1/activities/6672272d1b68e1f478bb698c/completed`).send({ completed: true }).set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(404);
  });
});

