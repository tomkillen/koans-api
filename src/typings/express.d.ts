import AuthService from "../services/auth/auth.service";
import UserService from "../services/user/user.service"

export {}

declare global {
  namespace Express {
    export interface Application {
      userService: UserService;
      authService: AuthService;
    }
  }
}