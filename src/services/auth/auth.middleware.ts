import { NextFunction, Request, Response } from 'express';
import logger from '../../utilities/logger';
import getBasicAuthCredentials from 'basic-auth';
import UserService from '../user/user.service';

/**
 * Middleware that writes an access token to `res.locals.accessToken` using basic http auth
 * @example req.headers.authorization = `Basic ${base64(`${username}:${password}`)}`
 * Upon auth failure, `res.locals.accessToken` is not defined 
 */
export const basicAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authInfo = getBasicAuthCredentials(req);

    if (authInfo && authInfo.name && authInfo.pass) {
      try {
        const token = await req.app.authService.getAuthTokenForUser({ username: authInfo.name }, authInfo.pass);
        res.locals.accessToken = token;
      } catch (err) {
        if (err instanceof Error && err.message === UserService.Errors.UserNotFound) {
          // User credentials are not valid or user does not exist
          // suppress this error since it is expected when authorization fails
          // but don't create an access token for the user
        } else {
          // Server error
          logger.error(`BasicAuth failed with error ${err}`);
          return next(err);
        }
      }
    } else {
      // User did not provide credentials, so don't authorize them
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware that writes the current user info to `res.locals.user` based on their Bearer token
 * @example req.headers.authorization = `Bearer <JWT>`
 * Upon auth failure, `res.locals.user` is not defined & res.status(401).end('Not Authorized) is sent
 */
export const bearerAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring('Bearer '.length);
      if (token) {
        const identity = await req.app.authService.getUserIdentity(token);
        const user = await req.app.userService.getUser(identity.id);
        if (user) {
          res.locals.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            created: user.created,
            // Restrict roles to those the user owns & that are present in the token
            roles: user.roles,
          };

          return next();
        }
      }
    }

    // If we got here, we did not authenticate the user
    res.status(401).end('Not Authorized');
  } catch (err) {
    logger.error(`BearerAuth failed with error ${err}`);
    // Failed to decode token or get user
    res.status(401).end('Not Authorized');
  }
};

/**
 * Middleware that writes the current user info to `res.locals.user` based on their Bearer token
 * and also checks that the user has an Admin role
 * @example req.headers.authorization = `Bearer <JWT>`
 * Upon auth failure, `res.locals.user` is not defined & res.status(401).end('Not Authorized) is sent
 */
export const adminBearerAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring('Bearer '.length);
      if (token) {
        const identity = await req.app.authService.getUserIdentity(token);
        const user = await req.app.userService.getUser(identity.id);
        if (user && user.roles && user.roles.includes('admin')) {
          res.locals.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            created: user.created,
            // Restrict roles to those the user owns & that are present in the token
            roles: user.roles,
          };

          return next();
        }
      }
    }

    // If we got here, we did not authenticate the user
    res.status(401).end('Not Authorized');
  } catch (err) {
    logger.error(`BearerAuth failed with error ${err}`);
    // Failed to decode token or get user
    res.status(401).end('Not Authorized');
  }
};

/**
 * Middleware that will write an access token to `res.locals.accessToken` using body parameters
 * @example res.body: { id: string, password: string }
 * @example res.body: { username: string, password: string }
 * @example res.body: { email: string, password: string }
 */
export const accessTokenWithCredentials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if ('password' in req.body && typeof req.body.password === 'string') {
      if ('id' in req.body && typeof req.body.id === 'string') {
        res.locals.accessToken = await req.app.authService.getAuthTokenForUser(req.body.id, req.body.password);
      } else if ('username' in req.body && typeof req.body.username === 'string') {
        res.locals.accessToken = await req.app.authService.getAuthTokenForUser({ username: req.body.username }, req.body.password);
      } else if ('email' in req.body && typeof req.body.email === 'string') {
        res.locals.accessToken = await req.app.authService.getAuthTokenForUser({ email: req.body.email }, req.body.password);
      }
    }
    next();
  } catch (err) {
    if (err instanceof Error && err.message === UserService.Errors.UserNotFound) {
      // User credentials are not valid or user does not exist
      // suppress this error since it is expected when authorization fails
      // but don't create an access token for the user
      delete res.locals.accessToken;
      next();
    } else {
      // Server error
      logger.error(`Auth failed with error ${err}`);
      return next(err);
    }
  }
}