import { Response, Request, Router } from "express";

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
 *       properties:
 *         id:
 *           type: string
 *           example: 1234
 *           description: users id
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
  router.post(path, (_, res) => res.status(501).send('Not Implemented'));
  router.patch(path, (_, res) => res.status(501).send('Not Implemented'));
  router.delete(path, (_, res) => res.status(501).send('Not Implemented'));

  return router;
};

export default user;