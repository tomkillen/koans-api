import express from 'express';
import cors from 'cors';
import api from './api';
import UserService from './services/user/user.service';
import { Mongoose } from 'mongoose';
import AuthService from './services/auth/auth.service';
import ActivityService from './services/activity/activity.service';
import populateDatabase from './helpers/populateDatabase';
import UserActivityService from './services/useractivity/useractivity.service';

/**
 * express.Application for the Koans API
 */
const App = async (mongooseClient: Mongoose) => {
  const app = express();

  // Setup services & application middlewares
  app.userService = new UserService(mongooseClient);
  app.authService = new AuthService({
    jwt: {
      audience: 'koans.example.com',
      issuer: 'koans.example.com',
      secret: 'use a certificate in prod',
    },
    userService: app.userService,
  });
  app.activityService = new ActivityService(mongooseClient);
  app.userActivityService = new UserActivityService(mongooseClient);

  // Ensure the database is ready for user before starting the server
  // Prevents race conditions with unique inserts before index has been built
  await Promise.all([
    app.userService.prepare(),
    app.activityService.prepare(),
    app.userActivityService.prepare(),
  ]);

  // DEBUG & Demonstration
  // Populate the database with some dummy data
  // In a production environment I would use some migration strategy
  // where documents & schema updates are applied sequentially, with a record
  // keeping table to track which migrations have been applied
  await populateDatabase(app.userService, app.activityService);

  // Setup permissive CORS policy since we aren't restricting usage of this API
  app.use(cors({
    // Allow any origin, this is an open service
    origin: '*',

    // IE11 and Smart TV's can't handle 204 for OPTIONS
    optionsSuccessStatus: 200,
  }));

  // Add api router
  app.use(api());

  // Catch-all not found handler
  app.all('*', (_, res) => {
    res.status(404).end('Not Found');
  });

  return app;
};

export default App;
