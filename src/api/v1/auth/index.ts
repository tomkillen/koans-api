import { Router, json } from "express"
import { accessTokenWithCredentials, basicAuth } from "../../../services/auth/auth.middleware";
import { body, oneOf, validationResult } from "express-validator";

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginWithId:
 *       type: object
 *       required:
 *         - id
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           example: <user id>
 *         password:
 *           type: string
 *           example: password
 *     LoginWithUsername:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: username
 *         password:
 *           type: string
 *           example: password
 *     LoginWithEmail:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: email@example.com
 *         password:
 *           type: string
 *           example: password
 * paths:      
 *   /auth:
 *     get:
 *       summary: Gets an access token using Basic auth
 *       tags:
 *         - auth
 *       security:
 *         - basicAuth: []
 *       responses:
 *         200:
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - access_token
 *                 properties:
 *                   access_token:
 *                     type: string
 *                     description: access token that can be used for Bearer authentication
 *         401:
 *           description: Not Authorized
 *     post:
 *       summary: Gets an access token using the supplied user credentials
 *       tags:
 *         - auth
 *       requestBody:
 *         description: Provide the user credentials to use for authentication
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/LoginWithId'
 *                 - $ref: '#/components/schemas/LoginWithUsername'
 *                 - $ref: '#/components/schemas/LoginWithEmail'
 *       responses:
 *         200:
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - access_token
 *                 properties:
 *                   access_token:
 *                     type: string
 *                     description: access token that can be used for Bearer authentication
 *         401:
 *           description: Not Authorized
 */
const auth = (): Router => {
  const router = Router();
  const path = '/auth';

  // Basic auth handler
  // expects Authorization: Basic <username>:<password>
  router.get(
    path,
    basicAuth,
    (_, res) => {
      // if Basic Auth is successful, authMiddleware.getAccessTokenWithBasicAuth
      // saves the access token to res.locals.accessToken
      if (res.locals.accessToken) {
        res.status(200).json({
          access_token: res.locals.accessToken
        }).end();
      } else {
        res.status(401).end('Not Authorized');
      }
    }
  );

  router.post(
    path,
    json(),
    oneOf([
      body('id').trim().isString().notEmpty(),
      body('username').trim().isString().notEmpty(),
      body('email').trim().isEmail(),
    ]),
    body('password').isString().notEmpty(),
    (req, res, next) => {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        res.status(401).end('Not Authorized');
      } else {
        next();
      }
    },
    accessTokenWithCredentials,
    (_, res) => {
      // if authorization is successful, authMiddleware.getAccessTokenWithCredentials
      // saves the access token to res.locals.accessToken
      if (res.locals.accessToken) {
        res.status(200).json({
          access_token: res.locals.accessToken
        }).end();
      } else {
        res.status(401).end('Not Authorized');
      }
    }
  );
  
  return router;
}

export default auth;