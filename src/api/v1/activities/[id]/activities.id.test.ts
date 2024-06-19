/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import Role from "../../../../services/auth/auth.roles";
import App from "../../../../App";
import generateActivity from "../../../../helpers/generateActivity";

describe('/v1/activities/:id', () => {
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
    ...generateActivity()
  };
  const anotherActivity = {
    id: '',
    created: '',
    ...generateActivity()
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

    activity.id = await app.activityService.createActivity(activity);
    activity.created = (await app.activityService.getActivity(activity.id)).created.toISOString();
    
    anotherActivity.id = await app.activityService.createActivity(anotherActivity);
    anotherActivity.created = (await app.activityService.getActivity(anotherActivity.id)).created.toISOString();
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('GET /v1/activities/:id => 200: get activity', async () => {
    const res = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual(activity);
  });
  test('GET /v1/activities/:id => 401: missing auth', async () => {
    const res = await supertest(app).get(`/v1/activities/${activity.id}`);
    expect(res.statusCode).toBe(401);
  });
  test('GET /v1/activities/:id => 404: invalid activity', async () => {
    const res = await supertest(app).get(`/v1/activities/6672272d1b68e1f478bb698c`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('PATCH /v1/activities/:id => 204: admin update activity', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send({
      duration: 500,
    })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(204);
    activity.duration = 500;
  });
  test('PATCH /v1/activities/:id => 400: bad data', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send({
      category: '',
    })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('PATCH /v1/activities/:id => 400: missing data', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send()
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('PATCH /v1/activities/:id => 401: not an admin', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send({
      duration: 1000,
    })
    .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(401);
  });
  test('PATCH /v1/activities/:id => 401: missing auth', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send({
      duration: 1000,
    });
    expect(res.statusCode).toBe(401);
  });
  test('PATCH /v1/activities/:id => 404: invalid activity', async () => {
    const res = await supertest(app).patch(`/v1/activities/6672272d1b68e1f478bb698c`)
    .send({
      duration: 1000,
    })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(404);
  });
  test('PATCH /v1/activities/:id => 409: duplicate title', async () => {
    const res = await supertest(app).patch(`/v1/activities/${activity.id}`)
    .send({
      title: anotherActivity.title,
    })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(409);
  });

  test('DELETE /v1/activities/:id => 400: bad id', async () => {
    // Note: if we start supporting slugs, this could become a 404
    const res = await supertest(app).delete(`/v1/activities/123`)
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });
  test('DELETE /v1/activities/:id => 401: not an admin', async () => {
    const res = await supertest(app).delete(`/v1/activities/${activity.id}`)
    .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(401);
  });
  test('DELETE /v1/activities/:id => 401: missing auth', async () => {
    const res = await supertest(app).delete(`/v1/activities/${activity.id}`);
    expect(res.statusCode).toBe(401);
  });
  test('DELETE /v1/activities/:id => 404: Doesnt exist', async () => {
    const res = await supertest(app).delete(`/v1/activities/6672272d1b68e1f478bb698c`)
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(404);
  });
  test('DELETE /v1/activities/:id => 204: admin delete activity', async () => {
    const res = await supertest(app).delete(`/v1/activities/${activity.id}`)
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(204);
  });
});