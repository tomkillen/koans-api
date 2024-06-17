import { NextFunction, Request, Response } from 'express';
import AuthService from "./auth.service";
import logger from '../../utilities/logger';
import getBasicAuthCredentials from 'basic-auth';
import { UserServiceErrors } from '../user/user.service';
import { bind } from 'decko';

type Config = {
  authService: AuthService;
}

class AuthMiddleware {
  private readonly authService: AuthService;

  constructor (config: Config) {
    this.authService = config.authService;
  }

  @bind
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
  }
}

export default AuthMiddleware;