import { Router, json } from "express";
import { body, header, validationResult } from "express-validator";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: username
 *         email:
 *           type: string
 *           example: email@example.com
 *         password:
 *           type: string
 *           example: password
 *     CreateUserResponse:
 *       type: object
 *       required:
 *         - id
 *         - access_token
 *       properties:
 *         id:
 *           type: string
 *           example: 1234
 *           description: users id
 *         access_token:
 *           type: string
 *           description: user access token suitable for Bearer auth (user is logged in upon create)
 *     GetUserResponse:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - email
 *         - created
 *       properties:
 *         id:
 *           type: string
 *           description: user id
 *           example: 1234
 *         username:
 *           type: string
 *           description: the users username
 *           example: user
 *         email:
 *           type: string
 *           description: the users email
 *           example: user@example.com
 *         created:
 *           type: string
 *           description: the users created timestamp
 *           example: 2011-09-07T08:37:37Z
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           example: username
 *         email:
 *           type: string
 *           example: email@example.com
 *         password:
 *           type: string
 *           example: password
 * paths:
 *   /user:
 *     get:
 *       summary: get the current users information
 *       security:
 *         - bearerAuth: []
 *       responses:  
 *         '200':
 *           description: Information about a single user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/GetUserResponse'
 *         '401':
 *           description: no current user is authenticated
 *     post:
 *       summary: creates a new user
 *       requestBody:
 *         description: information of the user to be created
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserRequest'
 *       responses:  
 *         '201':
 *           description: created
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CreateUserResponse'
 *         '400':
 *           description: missing or malformed data
 *         '401':
 *           description: a user is already logged in
 *         '409':
 *           description: a user with the provided username or email already exists
 *     patch:
 *       summary: updates the current user
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserRequest'
 *       responses:  
 *         '204':
 *           description: user updated
 *         '400':
 *           description: missing or malformed data
 *         '401':
 *           description: no user is logged in
 *         '409':
 *           description: a user with the provided username or email already exists
 *     delete:
 *       summary: delete the current user
 *       security:
 *         - bearerAuth: []
 *       responses:  
 *         200:
 *           description: user deleted
 *         401:
 *           description: no user is logged in
 */
const user = (): Router => {
  const path = '/user';
  const router = Router();

  router.get(path, (_, res) => res.status(501).send('Not Implemented'));
  router.post(
    path,
    json(),
    // Check that no current authorization exists, no current user
    header('Authorization').not().exists(),
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
      const username: string = req.body.username;
      const email: string = req.body.email;
      const password: string = req.body.password;
      try {
        // Ensure user does not already exist with this username and email
        if (await req.app.userService.getUser({ username }) !== null) {
          return res.status(409).send('User already exists').end();
        }
        if (await req.app.userService.getUser({ email }) !== null) {
          return res.status(409).send('User already exists').end();
        }

        // Create the user
        const id = await req.app.userService.createUser({
          username,
          email,
          password
        });

        // Authorize the user that was just created (login upon create)
        const access_token = await req.app.authService.getAuthTokenForUser(id, password);

        return res.status(201).json({ id, access_token }).end();
      } catch (err) {
        next(err);
      }
    },
  );
  router.patch(path, (_, res) => res.status(501).send('Not Implemented'));
  router.delete(path, (_, res) => res.status(501).send('Not Implemented'));

  return router;
};

export default user;