import { Router, json } from "express";
import { body, header, matchedData, validationResult } from "express-validator";
import { bearerAuth } from "../../../services/auth/auth.middleware";
import logger from "../../../utilities/logger";
import { UserServiceErrors } from "../../../services/user/user.service";

/**
 * Creates router for /user
 */
const user = (): Router => {
  const path = '/user';
  const router = Router();

  router.get(
    path,
    header('authorization').isJWT(),
    bearerAuth,
    (_, res) => {
      if (res.locals.user) {
        res.status(200).json({
          id: res.locals.user.id,
          username: res.locals.user.username,
          email: res.locals.user.email,
          created: res.locals.user.created,
          roles: res.locals.user.roles,
        });
      } else {
        res.status(401).send('Not Authorized').end();
      }
    },
  );

  router.post(
    path,
    json(),
    // Check that no current authorization exists, no current user
    header('authorization')
      .not()
      .exists(),
    // If a user is currently logged in, reject the request
    (req, res, next) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        res.status(401).send('You are already logged in').end();
      } else {
        next();
      }
    },
    // Validate parameters
    body('username').isString().notEmpty(),
    body('email').isString().notEmpty().isEmail(),
    body('password').isString().notEmpty(),
    (req, res, next) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        res.status(400).send('Malformed Request').end();
      } else {
        next();
      }
    },
    // Attempt to create the user
    async (req, res, next) => {
      const userData = matchedData<{ 
        username: string;
        email: string;
        password: string;
      }>(req);
      try {
        // Ensure user does not already exist with this username and email
        if (await req.app.userService.getUser({ username: userData.username }) !== null) {
          return res.status(409).send('User already exists').end();
        }
        if (await req.app.userService.getUser({ email: userData.email }) !== null) {
          return res.status(409).send('User already exists').end();
        }

        // Create the user
        const id = await req.app.userService.createUser({
          username: userData.username,
          email: userData.email,
          password: userData.password
        });

        // Authorize the user that was just created (login upon create)
        const access_token = await req.app.authService.getAuthTokenForUser(id, userData.password);

        return res.status(201).json({ id, access_token }).end();
      } catch (err) {
        next(err);
      }
    },
  );
  router.patch(
    path,
    header('authorization').isJWT(),
    bearerAuth,
    json(),
    body('username').isString().optional(),
    body('email').isEmail().optional(),
    body('password').isString().optional(),
    async (req, res) => {
      if (res.locals.user) {
        const userData = matchedData<{ 
          username?: string;
          email?: string;
          password?: string;
        }>(req);
        if (userData.username || userData.email || userData.password) {
          try {
            await req.app.userService.updateUser(res.locals.user.id, {
              username: userData.username,
              email: userData.email,
              password: userData.password,
            });
          } catch (err) {
            if (err instanceof Error && (
              err.message === UserServiceErrors.Username.Conflict ||
              err.message === UserServiceErrors.Email.Conflict
            )) {
              res.status(409).send('Conflict').end();
            } else {
              logger.error(`Error patching user ${err}`);
              res.status(500).send('Server error').end();
            }
          }
        }
        res.status(204).end();
      } else {
        res.status(401).send('Not Authorized').end();
      }
    },
  );

  router.delete(
    path,
    header('authorization').isJWT(),
    bearerAuth,
    async (req, res) => {
      if (res.locals.user) {
        try {
          await req.app.userService.deleteUser(res.locals.user.id);
          res.status(204).end();
        } catch (err) {
          logger.error(`Failed to delete user ${res.locals.user.id}`);
          res.status(500).send('Internal Server Error').end();
        }
      } else {
        res.status(401).send('Not Authorized').end();
      }
    },
  );

  return router;
};

export default user;