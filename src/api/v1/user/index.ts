import { NextFunction, Request, Response, Router, json } from "express";
import { Schema, body, checkSchema, header, matchedData, validationResult } from "express-validator";
import { bearerAuth } from "../../../services/auth/auth.middleware";
import UserService, { CreateUserRequestDTO, UpdateUserRequestDTO } from "../../../services/user/user.service";

const postUserSchema: Schema = {
  username: {
    in: 'body',
    exists: true,
    isString: true,
    isLength: { options: { min: 1 } },
  },
  email: {
    in: 'body',
    exists: true,
    isEmail: true,
    isLength: { options: { min: 1 } },
  },
  password: {
    in: 'body',
    exists: true,
    isString: true,
    // We also have available these validator:
    // isStrongPassword: true,
    // But since password requirements have not been defined, I am allowing weak passwords
    // We could also write our own password validator
    // custom: { options: customPasswordValidatorFunction }
    isLength: { options: { min: 1 } },
  }
};

/**
 * Creates router for /user
 */
const user = (): Router => {
  const path = '/user';
  const router = Router();

  // GET /v1/user
  // Get the current active users information
  // Responses:
  //  - 200 { id, username, email, created, roles? }
  //  - 401 Not Authorized
  router.get(
    path,
    header('authorization'),
    bearerAuth,
    (_: Request, res: Response) => {
      if (res.locals.user) {
        res.status(200).json({
          id: res.locals.user.id,
          username: res.locals.user.username,
          email: res.locals.user.email,
          created: res.locals.user.created,
          roles: res.locals.user.roles,
        }).end();
      } else {
        return res.status(401).end('Not Authorized');
      }
    },
  );

  // POST /v1/user
  // Register a new user
  // expects: body: { username: string, email: string (valid email), password: string }
  // Responses
  //  - 201 Created
  //  - 400 Bad Request
  //  - 401 Not Authorized (already logged in)
  //  - 409 Conflict (username or email conflict)
  router.post(
    path,
    json(),
    // Check that no current authorization exists, no current user
    header('authorization').not().exists(),
    // Validate request schema
    checkSchema(postUserSchema),
    // Attempt to create the user
    async (req: Request, res: Response, next: NextFunction) => {
      
      // Reject as unauthorized if the user is already logged in
      if (res.locals.user || res.locals.accessToken || req.headers.authorization) {
        return res.status(401).end('Already logged in');
      }

      // Check for schema validation issues
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).end('Malformed Request');
      }

      const userData = matchedData<{ 
        username: string;
        email: string;
        password: string;
      }>(req);

      try {

        // Be explicit about which fields we copy to the DTO
        // to help prevent unwanted data being injected
        const dto: CreateUserRequestDTO = {
          username: userData.username,
          email: userData.email,
          password: userData.password
        };

        // Create the user
        try {
          
          const id = await req.app.userService.createUser(dto);
          return res.status(201).json({ id }).end();

        } catch (err) {

          // Handle anticipated errors
          if (err instanceof Error && (
              err.message === UserService.Errors.Username.Conflict || 
              err.message === UserService.Errors.Email.Conflict)) {
            if (err.message === UserService.Errors.Username.Conflict) {
              // Hmm we are leaking information about existing users
              // which would aid a brute force attacker
              // But they would be able to work this out due to otherwise correct
              // responses being refused anyway, even if we pretended it was a 
              // server error the pattern would still be clear.
              // So in this situation, better to enable giving the user some useful
              // UI feedback
              return res.status(409).end('Username in use');
            } else {
              return res.status(409).end('Email in use');
            }
          } else {
            // Unhandled error
            next(err);
          }
        }
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /v1/user
  // Responses:
  // - 204 - Created
  // - 400 - Bad Request
  // - 401 - Not Authorized
  // - 409 - Conflict
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

      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).end('Bad Request'); 
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
            return next(err);
          }
        }
      } else {
        // Nothing to update
        return res.status(400).end('Bad Request'); 
      }
    },
  );

  // DELETE /v1/user
  // Deletes the current user
  // Responses
  //  - 204: Deleted
  //  - 401: Not Authorized (not logged in)
  //  - 404: User not found (usually would result in 401 but here in case of an extremely rare race condition)
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
          next(err);
        }
      }
    },
  );

  return router;
};

export default user;