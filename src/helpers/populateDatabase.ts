import ActivityService from "../services/activity/activity.service";
import { UserInfo } from "../services/user/user.model";
import UserService from "../services/user/user.service";
import generateActivity from "./generateActivity";

const users: UserInfo[] = [{
  username: 'admin',
  password: 'admin',
  email: 'admin@koans.example.com',
  roles: [ 'admin' ],
}, {
  username: 'first',
  password: 'first',
  email: 'first@example.com',
}, {
  username: 'second',
  password: 'second',
  email: 'second@example.com',
}];

/**
 * Ensures all users identified in the users array exist in the database
 */
const createUsers = async (userService: UserService) => {
  await Promise.all(users.map(async (user) => {
    const existing = await userService.getUser({ username: user.username });
    if (!existing) {
      await userService.createUser(user);
    }
  }));
};

/**
 * Ensures {count} randomized activities exist in the database
 */
const createActivities = async (activitiesService: ActivityService, count: number) => {
  const existing = await activitiesService.getActivities();
  const numToCreate = Math.max(0, count - existing.total);
  await Promise.all(Array.from({ length: numToCreate }).map(async () => {
    await activitiesService.createActivity(generateActivity());
  }));
};

/**
 * Helper utility that will seed the service with some initial data
 */
const populateDatabase = async (
  userService: UserService,
  activityService: ActivityService
) => {
  await Promise.all([
    createUsers(userService),
    createActivities(activityService, 1000),
  ]);
};

export default populateDatabase;