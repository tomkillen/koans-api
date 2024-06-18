import ActivityService from "../services/activity/activity.service";
import { UserInfo } from "../services/user/user.model";
import UserService from "../services/user/user.service";
import logger from "../utilities/logger";
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
}, {
  username: 'username',
  password: 'password',
  email: 'username@example.com',
}];

/**
 * Ensures all users identified in the users array exist in the database
 */
const createUsers = async (userService: UserService) => {
  await Promise.all(users.map(async (user) => {
    const existing = await userService.getUser({ username: user.username });
    if (!existing) {
      try {
        await userService.createUser(user);
        // logger.info(`DEBUG INFO: Created test user username: ${user.username} password: ${user.password}`);
      } catch (err) {
        logger.warning(`DEBUG WARNING: Failed to create test user: ${user.username} with error ${err}`);
      }
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
    const activity = generateActivity();
    try {
      await activitiesService.createActivity(activity);
    } catch (err) {
      logger.warning(`DEBUG WARNING: Failed to create test activity ${activity.title} with error ${err}`);
    }
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