import { Router, json } from "express";
import { body, header, matchedData, validationResult } from "express-validator";
import { bearerAuth } from "../../../services/auth/auth.middleware";
import logger from "../../../utilities/logger";
import UserService, { CreateUserRequestDTO, UpdateUserRequestDTO } from "../../../services/user/user.service";

/**
 * Creates router for /user
 */
const user = (): Router => {
  const path = '/user';
  const router = Router();

  // GET /user
  // Get the current active users information
  router.get(
    path,
    header('authorization'),
    bearerAuth,
    (_, res) => {
      if (res.locals.user) {
        res.status(200).json({
          id: res.locals.user.id,
          username: res.locals.user.username,
          email: res.locals.user.email,
          created: res.locals.user.created,
          roles: res.locals.user.roles,
        }).end();
      } else {
        res.status(401).end('Not Authorized');
      }
    },
  );

  // POST /user
  // Register a new user
  // expects: body: { username: string, email: string (valid email), password: string }
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
        res.status(401).end('You are already logged in');
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
        res.status(400).end('Malformed Request');
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
          return res.status(409).end('User already exists');
        }
        if (await req.app.userService.getUser({ email: userData.email }) !== null) {
          return res.status(409).end('User already exists');
        }

        // Be explicit about which fields we copy to the DTO
        // to help prevent unwanted data being injected
        const dto: CreateUserRequestDTO = {
          username: userData.username,
          email: userData.email,
          password: userData.password
        };

        // Create the user
        const id = await req.app.userService.createUser(dto);

        // Authorize the user that was just created (login upon create)
        const access_token = await req.app.authService.getAuthTokenForUser(id, userData.password);

        return res.status(201).json({ id, access_token }).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /user
  // Updates the current users details
  // expects: body: { username?: string, email?: string, password?: string }
  router.patch(
    path,
    header('authorization'),
    bearerAuth,
    json(),
    // Very simply schema so we can run the middleware directly
    // instead of building a schema object
    body('username').isString().optional(),
    body('email').isEmail().optional(),
    body('password').isString().optional(),
    async (req, res, next) => {
      // No user is logged in
      if (!res.locals.user) {
        return res.status(401).end('Not Authorized');
      }

      const data = matchedData<{ 
        username?: string;
        email?: string;
        password?: string;
      }>(req);
      if (data.username || data.email || data.password) {
        try {

          const dto: UpdateUserRequestDTO = {};
          
          if (data.username && data.username !== res.locals.user.username)
            dto.username = data.username;
          if (data.email && data.email !== res.locals.user.email)
            dto.email = data.email;
          // Can't compare to current password without hashing, so just let it through
          // to avoid paying hashing cost twice
          if (data.password)
            dto.password = data.password;

          await req.app.userService.updateUser(res.locals.user.id, dto);
          return res.status(204).end('User updated');
        } catch (err) {
          if (err instanceof Error && (
            err.message === UserService.Errors.Username.Conflict ||
            err.message === UserService.Errors.Email.Conflict
          )) {
            return res.status(409).end('Conflict');
          } else {
            logger.error(`Error patching user ${err}`);
            return next(err);
          }
        }
      }
    },
  );

  // DELETE /user
  // Deletes the current user
  // Responses
  //  - 204: Deleted
  //  - 401: Not Authorized (not logged in)
  //  - 404: User not found
  router.delete(
    path,
    header('authorization'),
    bearerAuth,
    async (req, res, next) => {
      if (!res.locals.user) {
        // No user is logged in
        return res.status(401).end('Not Authorized');
      }

      try {
        await req.app.userService.deleteUser(res.locals.user.id);
        return res.status(204).end('User deleted');
      } catch (err) {
        if (err instanceof Error && err.message === UserService.Errors.UserNotFound) {
          return res.status(404).end('User not found');
        } else {
          // Unhandled error
          logger.error(`Failed to delete user ${res.locals.user.id}`);
          next(err);
        }
      }
    },
  );

  return router;
};

export default user;