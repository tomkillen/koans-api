import { NextFunction, Request, Response } from 'express';
import AuthService from "./auth.service";
import logger from '../../utilities/logger';
import getBasicAuthCredentials from 'basic-auth';
import { UserServiceErrors } from '../user/user.service';

type Config = {
  authService: AuthService;
}

class AuthMiddleware {
  private readonly authService: AuthService;

  constructor (config: Config) {
    this.authService = config.authService;
  }

  async getAccessTokenWithBasicAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authInfo = getBasicAuthCredentials(req);

      if (authInfo && authInfo.name && authInfo.pass) {
        try {
          const token = await this.authService.getAuthTokenForUser({ username: authInfo.name }, authInfo.pass);
          res.locals.accessToken = token;
        } catch (err) {
          if (err instanceof Error && err.message === UserServiceErrors.UserNotFound) {
            // User credentials are not valid or user does not exist
            logger.info(`BasicAuth - Failed to authorize user ${JSON.stringify(authInfo)}`);
          } else {
            // Server error
            logger.error(`BasicAuth failed with error ${err}`);
            return next(err);
          }
        }
      } else {
        logger.info(`BasicAuth - Missing credentials: ${JSON.stringify(authInfo)}`);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  }
}

export default AuthMiddleware;