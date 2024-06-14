import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import UserService from "../user/user.service";

export type AuthConfig = {
  jwt?: {
    /** secret value for creating tokens */
    secretOrKey: string;
    /** issuer of the jwt token */
    issuer: string;
    /** audience of the jwt token */
    audience: string;
  },
}

class AuthService {
  constructor(userService: UserService, authConfig: AuthConfig) {
    // Configure auth strategies
    if (authConfig.jwt) {
      passport.use(new Strategy({
        ...authConfig.jwt,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      }, async (payload, done) => {
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'sub' in payload &&
          typeof payload.sub === 'string'
        ) {
          try {
            const user = await userService.getUser( payload.sub );
            if (user) {
              done(null, user);
            } else {
              done('user not found', false);
            }
          } catch (err) {
            done(err, false);
          }
        } else {
          done('invalid jwt', false);
        }
      }));
    }
  }
};

export default AuthService;