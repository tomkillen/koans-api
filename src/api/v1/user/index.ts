import { NextFunction, Response, Request, Router } from "express";

/**
 *  @openapi
 *  /user:
 *    get:
 *      summary: get the current users information
 *      security:
 *        - bearerAuth: []
 *      responses:  
 *        200:
 *          description: ok
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - username
 *                  - email
 *                  - created
 *                properties:
 *                  username:
 *                    type: string
 *                    description: the users username
 *                    example: user
 *                  email:
 *                    type: string
 *                    description: the users email
 *                    example: user@example.com
 *                  created:
 *                    type: string
 *                    description: the users created timestamp
 *                    example: 2011-09-07T08:37:37Z
 *        401:
 *          description: no current user is authenticated
 */
const getUser = (_: Request, res: Response, next: NextFunction): void => {
  res.status(501).send('not implemented');
  next('not implemented');
};

/**
 *  @openapi
 *  /user:
 *    post:
 *      summary: creates a new user
 *      requestBody:
 *        description: information of the user to be created
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - username
 *                - email
 *                - password
 *              properties:
 *                username:
 *                  type: string
 *                  description: the username to associate with this user
 *                  example: user
 *                email:
 *                  type: string
 *                  description: the email to associate with this user
 *                  example: user@example.com
 *                password:
 *                  type: string
 *                  description: the password to use to authenticate this user
 *                  example: Av3ryS3cure P@assWord!
 *      responses:  
 *        201:
 *          description: created
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - id
 *                properties:
 *                  id:
 *                    type: string
 *                    description: the id of the user that was created
 *        400:
 *          description: missing or malformed data
 *        401:
 *          description: a user is already logged in
 *        409:
 *          description: a user with the provided username or email already exists
 */
const createUser = (_: Request, res: Response, next: NextFunction): void => {
  res.status(501).send('not implemented');
  next('not implemented');
};

/**
 *  @openapi
 *  /user:
 *    patch:
 *      summary: updates the current user
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                  description: the username to associate with this user
 *                  example: user
 *                email:
 *                  type: string
 *                  description: the email to associate with this user
 *                  example: user@example.com
 *                password:
 *                  type: string
 *                  description: the password to use to authenticate this user
 *                  example: Av3ryS3cure P@assWord!
 *      responses:  
 *        204:
 *          description: user updated
 *        400:
 *          description: missing or malformed data
 *        401:
 *          description: no user is logged in
 *        409:
 *          description: a user with the provided username or email already exists
 */
const updateUser = (_: Request, res: Response, next: NextFunction): void => {
  res.status(501).send('not implemented');
  next('not implemented');
};

/**
 *  @openapi
 *  /user:
 *    delete:
 *      summary: delete the current user
 *      security:
 *        - bearerAuth: []
 *      responses:  
 *        200:
 *          description: user deleted
 *        401:
 *          description: no user is logged in
 */
const deleteUser = (_: Request, res: Response, next: NextFunction): void => {
  res.status(501).send('not implemented');
  next('not implemented');
};

/**
 * Creates a router for /user
 */
const user = (prefix: string): Router => {
  const path = `${prefix}/user`;
  const router = Router();

  router.get(path, getUser);
  router.post(path, createUser);
  router.patch(path, updateUser);
  router.delete(path, deleteUser);

  return router;
};

export default user;