/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import supertest from "supertest";
import express from "express";
import mongoose, { Mongoose } from "mongoose";
import generateActivity from "../../../../helpers/generateActivity";
import Role from "../../../../services/auth/auth.roles";
import App from "../../../../App";

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

  const user = {
    id: '',
    accessToken: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

  let category = 'Test Category';

  const activity = {
    id: '',
    ...generateActivity({ category: category }),
  };

  beforeAll(async () => {
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    app = await App(mongooseClient);
    
    // Create test admin user
    admin.id = await app.userService.createUser({ 
      username: admin.username, 
      email: admin.email,
      password: admin.password,
      roles: admin.roles,
    });
    admin.accessToken = await app.authService.getAuthTokenForUser(admin.id, admin.password);

    // Create non-admin user
    user.id = await app.userService.createUser({ 
      username: user.username, 
      email: user.email,
      password: user.password,
    });
    user.accessToken = await app.authService.getAuthTokenForUser(user.id, user.password);

    // Create test activity to ensure the category exists
    activity.id = await app.activityService.createActivity(activity);
  });

  afterAll(async () => {
    await mongooseClient?.disconnect();
    mongooseClient = null;
  });

  test('GET /v1/categories/:name => 200, list activities in a cateogry', async () => {
    const res = await supertest(app).get(`/v1/categories/${category}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
  });

  test('GET /v1/categories/:name => 401, missing auth', async () => {
    const res = await supertest(app).get(`/v1/categories/${category}`);
    expect(res.statusCode).toBe(401);
  });

  test('GET /v1/categories/:name => 404, incorrect category', async () => {
    const res = await supertest(app).get(`/v1/categories/doesnt exist`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('GET /v1/categories/:name => 400, bad query', async () => {
    const res = await supertest(app).get(`/v1/categories/${category}?page=-1`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /v1/categories/:name => 401, missing auth', async () => {
    const newName = 'changed category name';
    const res = await supertest(app).patch(`/v1/categories/${category}`)
    .send({ newName });
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /v1/categories/:name => 401, not admin', async () => {
    const newName = 'changed category name';
    const res = await supertest(app).patch(`/v1/categories/${category}`)
    .send({ newName })
    .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(401);
  });

  test('PATCH /v1/categories/:name => 400, missing new name', async () => {
    const res = await supertest(app).patch(`/v1/categories/${category}`)
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /v1/categories/:name => 400, empty new name', async () => {
    const res = await supertest(app).patch(`/v1/categories/${category}`)
    .send({ newName: '' })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /v1/categories/:name => 204, rename a category', async () => {
    // Get the current value for comparison
    const getOldCategory = await supertest(app).get(`/v1/categories/${category}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getOldCategory.status).toBe(200);

    // Rename it using patch
    const newName = 'changed category name';
    const res = await supertest(app).patch(`/v1/categories/${category}`)
    .send({ newName })
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(204);

    // Check the new category matches the old one, except for name
    const getNewName = await supertest(app).get(`/v1/categories/${newName}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getNewName.status).toBe(200);
    expect(getNewName.body.page).toBe(getOldCategory.body.page);
    expect(getNewName.body.pageSize).toBe(getOldCategory.body.pageSize);
    expect(getNewName.body.total).toBe(getOldCategory.body.total);

    // The old category should now 404
    const getPreviousCategory = await supertest(app).get(`/v1/categories/${category}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getPreviousCategory.status).toBe(404);

    // Get the test activity and it should have the new category applied
    const getActivity = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getActivity.statusCode).toBe(200);
    expect(getActivity.body.category).toBe(newName);

    category = newName;
  });

  test('DELETE /v1/categories/:name => 401, missing auth', async () => {
    const res = await supertest(app).delete(`/v1/categories/${category}`)
    expect(res.statusCode).toBe(401);
  });

  test('DELETE /v1/categories/:name => 401, not admin', async () => {
    const res = await supertest(app).delete(`/v1/categories/${category}`)
    .set('Authorization', `Bearer ${user.accessToken}`);
    expect(res.statusCode).toBe(401);
  });

  test('DELETE /v1/categories/:name => 204, delete a category', async () => {
    // Get the current value for comparison
    const preDelete = await supertest(app).get(`/v1/categories/${category}`).set('Authorization', `Bearer ${admin.accessToken}`);;
    expect(preDelete.status).toBe(200);

    // Delete the category
    const res = await supertest(app).delete(`/v1/categories/${category}`)
    .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.statusCode).toBe(204);

    // The old category should now 404
    const postDelete = await supertest(app).get(`/v1/categories/${category}`).set('Authorization', `Bearer ${admin.accessToken}`);;
    expect(postDelete.status).toBe(404);

    // Get the test activity and it should now 404
    const getActivity = await supertest(app).get(`/v1/activities/${activity.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
    expect(getActivity.statusCode).toBe(404);
  });
});