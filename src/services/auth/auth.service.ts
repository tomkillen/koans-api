import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { SignOptions, sign } from 'jsonwebtoken';
import UserService from "../user/user.service";
import Role from "./auth.roles";

type JWTConfig = {
  /** audience of the jwt token */
  audience: string;
  /** issuer of the jwt token */
  issuer: string;
  /** secret value for creating tokens */
  secretOrKey: string;
};

type Config = {
  jwt: JWTConfig;
  userService: UserService;
};

class AuthService {
  private readonly userService: UserService;
  private readonly jwt: JWTConfig;

  constructor(config: Config) {
    this.userService = config.userService;
    this.jwt = config.jwt;

    // Configure auth strategies, currently only JWT but we could support more
    passport.use(new Strategy({
      ...config.jwt,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    }, async (payload, done) => {
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'sub' in payload &&
        typeof payload.sub === 'string'
      ) {
        try {
          const user = await config.userService.getUser( payload.sub );
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

  async getAuthTokenForUser(userId: string | { username: string } | { email: string }, password: string): Promise<string> {
    return this.signUserIdentity(await this.userService.getUserWithCredentials(userId, password));
  }

  private signUserIdentity(userIdentity: { id: string, roles?: Role[] }): string {
    return this.signPayload({
      sub: userIdentity.id,
      roles: userIdentity.roles,
    });
  }

  private signPayload(payload: object): string {
    return sign(
      payload,
      this.jwt.secretOrKey,
      {
        audience: this.jwt.audience,
        issuer: this.jwt.issuer,
        expiresIn: '8h',
      }
    )
  }
};

export default AuthService;