import { Router, json } from "express"
import { accessTokenWithCredentials, basicAuth } from "../../../services/auth/auth.middleware";
import { body, oneOf, validationResult } from "express-validator";

/**
 * Creates router for /auth
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