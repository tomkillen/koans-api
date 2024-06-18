/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose, { Mongoose } from "mongoose";
import ActivityService, { GetActivityResponseDTO } from "./activity.service";
import { ActivityInfo } from "./activity.model";
import generateActivity from "../../helpers/generateActivity";

type TestActivity = {
  id?: string;
} & ActivityInfo;

const testActivities: TestActivity[] = Array.from({ length: 100 }).map(() => generateActivity());

// add some known search terms
testActivities.forEach((activity, i) => {
  activity.content += ' stegosaurus';
  if (i % 2 == 0) {
    activity.description += ' quarternion';
  }
});

const testCategories = [...new Set(testActivities.map(activity => activity.category))];

describe('activity.service', () => {
  let mongooseClient: Mongoose | null = null; 
  let activityService: ActivityService | null = null;

  beforeAll(async () => {
    // @shelf/jest-mongodb creates an in-memory mongo instance and injects the URI
    mongooseClient = await mongoose.connect((global as any).__MONGO_URI__ as string);
    activityService = new ActivityService(mongooseClient);
    await activityService.prepare();
  });

  afterAll(async () => {
    try {
      await mongooseClient?.disconnect();
    } finally {
      activityService = null;
    }
  });

  testActivities.forEach((testActivity, i) => test(`create activity ${i}`, async () => {
    expect(testActivity.id).toBeUndefined();
    testActivity.id = await activityService!.createActivity(testActivity);
    expect(testActivity.id).toBeDefined();
    expect(typeof testActivity.id).toEqual('string');

    const getActivity = await activityService!.getActivity(testActivity.id!);
    expect(getActivity.id).toEqual(testActivity.id);
    expect(getActivity.title).toEqual(testActivity.title);
    expect(getActivity.category).toEqual(testActivity.category);
    expect(getActivity.description).toEqual(testActivity.description);
    expect(getActivity.duration).toEqual(testActivity.duration);
    expect(getActivity.difficulty).toEqual(testActivity.difficulty);
    expect(getActivity.content).toEqual(testActivity.content);
    expect(getActivity.created).toBeInstanceOf(Date);
    expect(getActivity.created.getUTCDate()).toBeLessThanOrEqual(Date.now());
  }));

  test('get some activities', async () => {
    const getActivities = await activityService!.getActivities({
      page: 1,
      pageSize: 10,
    });
    const testActivityIds = testActivities.map(testActivity => testActivity.id!);
    expect(getActivities.total).toBe(testActivities.length);
    expect(getActivities.activities.length).toBe(10);
    expect(getActivities.page).toBe(1);
    expect(getActivities.pageSize).toBe(10);
    getActivities.activities.forEach(activity => {
      expect(activity.id).toBeDefined();
      expect(activity.created).toBeInstanceOf(Date);
      expect(testActivityIds.indexOf(activity.id)).toBeGreaterThanOrEqual(0);
    });
  });

  test('paginate activities', async () => {
    let page = 1;
    let total = -1;
    const testActivityIds = testActivities.map(testActivity => testActivity.id!);
    const allActivities: GetActivityResponseDTO[] = [];
    do {
      const allActivityIds = allActivities.map(activity => activity.id);
      const getActivities = await activityService!.getActivities({ page });
      if (total === -1) {
        expect(getActivities.total).toBeGreaterThanOrEqual(total);
      } else {
        expect(getActivities.total).toBe(total);
      }
      total = getActivities.total;
      expect(getActivities.total).toBe(testActivities.length);
      expect(getActivities.activities.length).toBeLessThanOrEqual(getActivities.pageSize);
      expect(getActivities.page).toBe(page);
      getActivities.activities.forEach(activity => {
        expect(activity.id).toBeDefined();
        expect(activity.created).toBeInstanceOf(Date);
        expect(testActivityIds.indexOf(activity.id)).toBeGreaterThanOrEqual(0);
        expect(allActivityIds.indexOf(activity.id)).toBeLessThan(0);
        allActivities.push(activity);
        allActivityIds.push(activity.id);
      });
      page += 1;
    } while (allActivities.length < total)
  });

  testCategories.forEach(category => {
    test(`get category ${category}`, async () => {
      const result = await activityService!.getActivities({ category });
      expect(result.total).toBe(testActivities.filter(activity => activity.category === category).length);
      result.activities.forEach(activity => {
        expect(activity.category).toBe(category);
      });
    });
  });

  // every activity is given the search term stegosaurus
  test('text search "stegosaurus"', async () => {
    const result = await activityService!.getActivities({ searchTerm: 'stegosaurus' });
    expect(result.total).toBe(testActivities.length);
  });

  // every 2nd is given the term quarternion
  test('text search "quarternion"', async () => {
    const result = await activityService!.getActivities({ searchTerm: 'quarternion' });
    expect(result.total).toBe(testActivities.length / 2);
  });

  // rename a category
  test(`rename ${testCategories[0]}`, async () => {
    const originalCategory = testCategories[0];
    const newCategory = 'horse riding';
    const originalCount = testActivities.filter(activity => activity.category === originalCategory).length;
    const originalResult = await activityService!.getActivities({ category: originalCategory });
    expect(originalResult.total).toBe(originalCount);
    originalResult.activities.forEach(activity => {
      expect(activity.category).toBe(originalCategory);
    });
    const modifiedCount = await activityService!.renameCategory(originalCategory, newCategory);
    expect(modifiedCount).toBe(originalCount);
    const oldResult = await activityService!.getActivities({ category: originalCategory });
    expect(oldResult.total).toBe(0);
    const newResult = await activityService!.getActivities({ category: newCategory });
    expect(newResult.total).toBe(originalCount);
    newResult.activities.forEach(activity => {
      expect(activity.category).toBe(newCategory);
    });
    // Update test data
    testCategories[0] = newCategory;
    testActivities.forEach(activity => {
      if (activity.category === originalCategory) {
        activity.category = newCategory;
      }
    });
  });

  // delete a category!
  test(`delete category "horse riding"`, async () => {
    const category = 'horse riding';
    const affectedActivitiesCount = testActivities.filter(activity => activity.category === category).length;
    const preDeleteResult = await activityService!.getActivities({ category });
    expect(preDeleteResult.total).toBe(affectedActivitiesCount);
    const deletedCount = await activityService!.deleteCategory(category);
    expect(deletedCount).toBe(affectedActivitiesCount);
    const postDeleteResult = await activityService!.getActivities({ category });
    expect(postDeleteResult.total).toBe(0);
    const getAllActivities = await activityService!.getActivities();
    expect(getAllActivities.total).toBe(testActivities.length - deletedCount);
    getAllActivities.activities.forEach(activity => {
      expect(activity.category === category).toBe(false);
    });
  });
});