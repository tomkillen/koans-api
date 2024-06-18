import { JwtPayload, sign, verify } from 'jsonwebtoken';
import UserService from "../user/user.service";
import Role from "./auth.roles";

type JWTConfig = {
  /** audience of the jwt token */
  audience: string;
  /** issuer of the jwt token */
  issuer: string;
  /** 
   * secret value for creating tokens 
   * Commentary: a private key would be better for a production app but I am using a string
  */
  secret: string;
};

type Config = {
  jwt: JWTConfig;
  userService: UserService;
};

export type AuthIdentity = {
  id: string;
  roles?: Role[];
};

class AuthService {
  private readonly userService: UserService;
  private readonly jwt: JWTConfig;

  constructor(config: Config) {
    this.userService = config.userService;
    this.jwt = config.jwt;
  }

  async getAuthTokenForUser(userId: string | { username: string } | { email: string }, password: string): Promise<string> {
    return this.signUserIdentity(await this.userService.getUserWithCredentials(userId, password));
  }

  async getUserIdentity(accessToken: string): Promise<AuthIdentity> {
    const payload = await this.decode(accessToken);
    if (
      !payload || 
      typeof payload !== 'object' ||
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      (payload.roles && !Array.isArray(payload.roles))
    ) {
      throw new Error('Unexpected identity');
    }

    return {
      id: payload.sub,
      roles: payload.roles
    }
  }

  private async signUserIdentity(userIdentity: AuthIdentity): Promise<string> {
    return await this.signPayload({
      sub: userIdentity.id,
      roles: userIdentity.roles,
    });
  }

  private async decode(token: string): Promise<string | JwtPayload> {
    return new Promise((resolve, reject) => {
      verify(
        token, 
        this.jwt.secret,
        (err, decoded) => {
          if (err || !decoded) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
  }

  private async signPayload(payload: object): Promise<string> {
    return new Promise((resolve, reject) => {
      sign(
        payload,
        this.jwt.secret,
        {
          audience: this.jwt.audience,
          issuer: this.jwt.issuer,
          expiresIn: '8h',
        },
        (err, encoded) => {
          if (err || !encoded) {
            reject(err);
          } else {
            resolve(encoded);
          }
        },
      )
    });
  }
};

export default AuthService;