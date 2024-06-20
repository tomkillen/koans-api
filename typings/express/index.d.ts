import ActivityService from "../../src/services/activity/activity.service";
import Role from "../../src/services/auth/auth.roles";
import AuthService from "../../src/services/auth/auth.service";
import UserService from "../../src/services/user/user.service"
import UserActivityService from "../../src/services/useractivity/useractivity.service";

declare global {
  namespace Express {
    // We inject these dependencies into express.app.locals
    // so provide typings here that indicate these values WILL be defined
    export interface Application {
      userService: UserService;
      authService: AuthService;
      activityService: ActivityService;
      userActivityService: UserActivityService;
    }
    // Some middleware creates these values in express.response.locals
    // so provide typings here that indicate these values MAY be defined
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

export {}