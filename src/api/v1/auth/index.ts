import { NextFunction, Request, Response, Router } from "express"
import AuthMiddleware from "../../../services/auth/auth.middleware";

const auth = (authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  // Basic auth handler
  // expects Authorization: Basic <username>:<password>
  router.get(
    `/auth`,
    authMiddleware.getAccessTokenWithBasicAuth,
    (_, res) => {
      // if Basic Auth is successful, authMiddleware.getAccessTokenWithBasicAuth
      // saves the access token to res.locals.accessToken
      console.log(`Got Access Token: ${JSON.stringify(res.locals.accessToken)}`);
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