import ActivityService from "../../src/services/activity/activity.service";
import Role from "../../src/services/auth/auth.roles";
import AuthService from "../../src/services/auth/auth.service";
import UserService from "../../src/services/user/user.service"

export {}

declare global {
  namespace Express {
    export interface Application {
      userService: UserService;
      authService: AuthService;
      activityService: ActivityService;
    }
    export interface Locals {
      accessToken?: string;
      user?: {
        id: string;
        username: string;
        email: string;
        created: Date;
        roles?: Role[];
      };
    }
  }
}