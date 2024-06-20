/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose, { Mongoose } from "mongoose";
import UserActivityService from "./useractivity.service";
import UserService from "../user/user.service";
import ActivityService from "../activity/activity.service";
import generateActivity from "../../helpers/generateActivity";

describe('user activity service', () => {
  let mongooseClient: Mongoose | null = null; 
  let userActivityService: UserActivityService = null!;
  let userService: UserService = null!;
  let activityService: ActivityService = null!;

  const user = {
    id: '',
    username: 'test user 1',
    email: 'testuser1@example.com',
    password: 'test user 1 password',
  };

  const category0 = 'test category 0';
  const category1 = 'test category 1';
  const category2 = 'test category 2';

  const activities = [
    { id: '', ...generateActivity({ title: 'test activity 0', category: category0 }) },
    { id: '', ...generateActivity({ title: 'test activity 1', category: category0 }) },
    { id: '', ...generateActivity({ title: 'test activity 2', category: category0 }) },
    { id: '', ...generateActivity({ title: 'test activity 3', category: category1 }) },
    { id: '', ...generateActivity({ title: 'test activity 4', category: category1 }) },
    { id: '', ...generateActivity({ title: 'test activity 5', category: category1 }) },
    { id: '', ...generateActivity({ title: 'test activity 6', category: category2 }) },
    { id: '', ...generateActivity({ title: 'test activity 7', category: category2 }) },
    { id: '', ...generateActivity({ title: 'test activity 8', category: category2 }) },
  ];

  beforeAll(async () => {
    // @shelf/jest-mongodb creates an in-memory mongo instance and injects the URI
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    userActivityService = new UserActivityService(mongooseClient);
    userService = new UserService(mongooseClient);
    activityService = new ActivityService(mongooseClient);
    await Promise.all([
      userService.prepare(),
      activityService.prepare(),
      userActivityService.prepare(),
    ]);

    user.id = await userService.createUser(user);
    await Promise.all(activities.map(async activity => {
      activity.id = await activityService.createActivity(activity);
    }));
  });

  afterAll(async () => {
    try {
      await mongooseClient?.disconnect();
    } finally {
      userService = null!;
      activityService = null!;
      userActivityService = null!;
    }
  });

  test('complete activity', async () => {
    await userActivityService.completeActivity(user.id, activities[0].id);
  });

  test('get activities', async () => {
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(1);
  });

  test('uncomplete activity', async () => {
    await userActivityService.uncompleteActivity(user.id, activities[0].id);
  });

  test('uncomplete activity throws if not complete', async () => {
    let err: any = null;
    try {
      await userActivityService.uncompleteActivity(user.id, activities[0].id);
    } catch (e) {
      err = e;
    }
    expect(err).toHaveProperty('message');
    expect(err.message).toBe(UserActivityService.Errors.AlreadyNotComplete);
  });

  test('complete many', async () => {
    await userActivityService.completeActivity(user.id, activities[0].id);
    await userActivityService.completeActivity(user.id, activities[1].id);
    await userActivityService.completeActivity(user.id, activities[2].id);
  });

  test('cant complete twice', async () => {
    let err: any = null;
    try {
      await userActivityService.completeActivity(user.id, activities[0].id);
    } catch (e) {
      err = e;
    }
    expect(err).toHaveProperty('message');
    expect(err.message).toBe(UserActivityService.Errors.AlreadyComplete);
  });

  test('get activities (3)', async () => {
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(3);
  });

  test('delete activity cascades', async () => {
    await activityService.deleteActivity(activities[0].id);
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(2);
  });

  test('complete more activities', async () => {
    await userActivityService.completeActivity(user.id, activities[3].id);
    await userActivityService.completeActivity(user.id, activities[4].id);
    await userActivityService.completeActivity(user.id, activities[5].id);
  });

  test('get activities (5)', async () => {
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(5);
  });

  test('get activity complete is true', async () => {
    const result = await userActivityService.isActivityComplete(user.id, activities[4].id);
    expect(result).toBe(true);
  });

  test('get activity complete is false', async () => {
    const result = await userActivityService.isActivityComplete(user.id, activities[7].id);
    expect(result).toBe(false);
  });

  test('delete category cascades', async () => {
    await activityService.deleteCategory(category1);
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(2);
  });

  test('delete not completed category doesnt', async () => {
    await activityService.deleteCategory(category2);
    const result = await userActivityService.getCompletedActivities(user.id);
    expect(result.total).toBe(2);
  });

  test('update category cascades', async () => {
    await activityService.renameCategory(category0, 'something new');
    const idx = 2;
    const activityA = await activityService.getActivity(activities[idx].id);
    const userActivityA = await userActivityService.getUserActivity(user.id, activities[idx].id);
    expect(userActivityA).toBeDefined();
    expect(activityA.id).toBe(userActivityA?.id);
    expect(activityA.category).toBe(userActivityA?.category);
    expect(activityA.title).toBe(userActivityA?.title);
    expect(activityA.difficulty).toBe(userActivityA?.difficulty);
    expect(activityA.duration).toBe(userActivityA?.duration);

    await activityService.updateActivity(activityA.id, { title: 'a new title', difficulty: 3, duration: 500 });

    const activityB = await activityService.getActivity(activities[idx].id);
    const userActivityB = await userActivityService.getUserActivity(user.id, activities[idx].id);
    expect(userActivityB).toBeDefined();
    expect(activityB.id).toBe(userActivityB?.id);
    expect(activityB.title).toBe(userActivityB?.title);
    expect(activityB.category).toBe(userActivityB?.category);
    expect(activityB.difficulty).toBe(userActivityB?.difficulty);
    expect(activityB.duration).toBe(userActivityB?.duration);
  });
});