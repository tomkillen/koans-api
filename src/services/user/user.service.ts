import mongoose, { Mongoose, isObjectIdOrHexString } from "mongoose";
import User, { IUser, UserValidationErrors } from "./user.model";
import objectIdToString from "../../helpers/objectIdToHexString";
import stringToObjectId from "../../helpers/hexStringToObjectId";
import Role, { isValidRole } from "../auth/auth.roles";
import logger from "../../utilities/logger";
import UserActivity from "../useractivity/useractivity.model";

// Request DTO for creating a new user
export type CreateUserRequestDTO = {
  username: string;
  email: string;
  password: string;
  roles?: Role[];
};

/**
 * Typegaurd for CreateUserRequestDTO
 */
const isCreateUserRequestDTO = (value: unknown): value is CreateUserRequestDTO => {
  if (
    typeof value === 'object' && value !== null &&
    'username' in value && typeof value.username === 'string' && value.username.length >= 1 &&
    'email' in value && typeof value.email === 'string' && value.email.length >= 1 &&
    'email' in value && typeof value.email === 'string' && value.email.length >= 1
  ) {
    if ('roles' in value) {
      if (!Array.isArray(value.roles)) {
        return false;
      }
      if (value.roles.some(role => !isValidRole(role))) {
        return false;
      }
    }

    return true;
  }

  return false;
}

// Request DTO for updating a users information
export type UpdateUserRequestDTO = {
  username?: string;
  email?: string;
  password?: string;
  roles?: Role[];
};

/**
 * Typegaurd for UpdateUserRequestDTO
 */
const isUpdateUserRequestDTO = (value: unknown): value is UpdateUserRequestDTO => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if ('username' in value && (typeof value.username !== 'string' || value.username.length === 0)) {
    return false;
  }

  if ('email' in value && (typeof value.email !== 'string' || value.email.length === 0)) {
    return false;
  }

  if ('password' in value && (typeof value.password !== 'string' || value.password.length === 0)) {
    return false;
  }

  if ('roles' in value && (!Array.isArray(value.roles) || value.roles.some(role => !isValidRole(role)))) {
    return false;
  }

  return true;
}

// Request DTO for identifying a user
// id, username, and email are all unique and so any could be used to identify a user
// if IdentifyUserDTO is a string, it is treated as the id
export type IdentifyUserDTO = {
  /** identify user by username */
  username: string;
} | {
  /** identify user by email */
  email: string;
} | string;

/**
 * Typegaurd for IdentifyUserDTO
 */
const isIdentifyUserDTO = (value: unknown): value is IdentifyUserDTO => {
  if (typeof value === 'string' && isObjectIdOrHexString(value)) {
    return true;
  } else if (typeof value === 'object' && value !== null) {
    if ('username' in value && typeof value.username === 'string' && value.username.length >= 1) {
      return true;
    } else if ('email' in value && typeof value.email === 'string' && value.email.length >= 1) {
      return true;
    }
  }

  return false;
}

// Response DTO for getting a users information
export type GetUserResponseDTO = {
  id: string;
  username: string;
  email: string;
  created: Date;
  roles?: Role[];
};

/**
 * Simple utility to convert a User model to a GetUserDTO
 * @param user the user model
 * @returns GetUserResponseDTO projection of this user
 */
const userToGetUserResponseDTO = (user: IUser): GetUserResponseDTO => {
  return {
    id: objectIdToString(user._id),
    username: user.username,
    email: user.email,
    created: user._id.getTimestamp(),
    roles: user.roles && user.roles.length > 0 ? user.roles : undefined,
  };
}

class UserService {
  public static readonly Errors = {
    UserNotFound: 'user not found',
    MalformedRequest: 'malformed request',
  
    // Embed User Model errors to be friendly to consumers of this service
    Username: {
      Conflict: 'username already in use',
      ...UserValidationErrors.Username,
    },
    Email: {
      Conflict: 'email already in use',
      ...UserValidationErrors.Email,
    },
    Password: UserValidationErrors.Password,
  };

  private readonly db: Mongoose;

  /**
   * UserService is a service for interacting with the User data
   * It is not the role of UserService to determine if operations are authorized.
   * @param mongooseClient Mongoose connection
   */
  constructor(mongooseClient: Mongoose) {
    this.db = mongooseClient;
  }

  async prepare(): Promise<void> {
    // Ensure required models are initialized to avoid certain race conditions
    // Typically not an issue in production but this might mess with our tests.
    await User.init();
  }

  /**
   * Creates a new user with the given username, email, & password
   * @param userData the user to be created
   * @returns the id of the created user
   * @throws if the user could not be created
   */
  async createUser (userData: CreateUserRequestDTO): Promise<string> {
    if (!isCreateUserRequestDTO(userData)) {
      throw new Error(UserService.Errors.MalformedRequest);
    }

    try {
      
      return objectIdToString((await (await User.create({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        roles: userData.roles,
      })).save())._id);

    } catch (err) {

      // Sniff for username & email collisions
      if (err instanceof mongoose.mongo.MongoServerError &&
          err.code == '11000' &&
          err['keyPattern'] &&
          ('username' in err['keyPattern'] || 'email' in err['keyPattern'])) 
      {
        // Either the username or email collided
        if ('username' in err['keyPattern']) {
          throw new Error(UserService.Errors.Username.Conflict)
        } else {
          throw new Error(UserService.Errors.Email.Conflict)
        }

      } else {
        // Unhandled error, rethrow
        throw err;
      }
      
    }
  }

  /**
   * Updates the identified user with the given user data
   * @param userIdentity identifies the user to be updated
   * @param userData the changes to patch into the user
   * @returns the updated user data
   * @throws if no user data was changed
   */
  async updateUser (userIdentity: IdentifyUserDTO, userData: UpdateUserRequestDTO): Promise<void> {
    if (!isIdentifyUserDTO(userIdentity) || !isUpdateUserRequestDTO(userData)) {
      throw new Error(UserService.Errors.MalformedRequest);
    }

    let modifiedCount = 0;

    try {

      if (typeof userIdentity === 'string') {
        // Update user identified by id
        modifiedCount = (await User.updateOne({ _id: stringToObjectId(userIdentity) }, {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          roles: userData.roles,
        })).modifiedCount;
      } else {
        // Update user identified by username or email
        modifiedCount = (await User.updateOne(userIdentity, {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          roles: userData.roles,
        })).modifiedCount;
      }

    } catch (err) {

      // Sniff for username & email collisions
      if (err instanceof mongoose.mongo.MongoServerError &&
        err.code == '11000' &&
        err['keyPattern'] &&
        ('username' in err['keyPattern'] || 'email' in err['keyPattern'])) 
      {
        // Either the username or email collided
        if ('username' in err['keyPattern']) {
          throw new Error(UserService.Errors.Username.Conflict)
        } else {
          throw new Error(UserService.Errors.Email.Conflict)
        }

      } else {
        // Unhandler error, rethrow
        throw err;
      }
    }

    if (modifiedCount > 1) {
      // serious problem should be logged to metrics and the server should take itself offline
      logger.fatal(`FATAL: More than 1 user modified by updateUser`);
      throw new Error('Server very unhealthy');
    }

    if (modifiedCount === 0) {
      throw new Error(UserService.Errors.UserNotFound);
    }
  }

  /**
   * Deletes the user with the given id
   * @param userIdStr identifies the user to be deleted
   * @throws if the no user was deleted
   */
  async deleteUser (userIdStr: string): Promise<void> {
    if (typeof userIdStr !== 'string' || !userIdStr) {
      throw new Error(UserService.Errors.MalformedRequest);
    }

    // Delete user identified by id
    const userId = stringToObjectId(userIdStr);
    const deletedCount = (await User.deleteOne({ _id: userId })).deletedCount;

    // Delete UserActivity records for this user
    await UserActivity.deleteMany({ userId });

    if (deletedCount === 0) {
      throw new Error(UserService.Errors.UserNotFound);
    }

    if (deletedCount > 1) {
      // More than 1 user deleted, a very serious error
      logger.fatal(`FATAL: More than 1 user deleted by deleteUser`);
      throw new Error('Server very unhealthy');
    }
  }
  
  /**
   * Gets user information
   * @param userIdentity identifies the user we want information about
   * @returns information about the user
   * @throws if the user is not found
   */
  async getUser (userIdentity: IdentifyUserDTO): Promise<GetUserResponseDTO | null> {
    if (!isIdentifyUserDTO(userIdentity)) {
      throw new Error(UserService.Errors.MalformedRequest);
    }

    let user: IUser | null = null;

    if (typeof userIdentity === 'string') {
      user = await User.findById(stringToObjectId(userIdentity));
    } else {
      user = await User.findOne(userIdentity);
    }

    if (user) {
      return userToGetUserResponseDTO(user);
    } else {
      return null;
    }
  }

  /**
   * Get's a user only if the provided password matches the users password
   * @param userIdentity Identifies the user we want to get
   * @param password The users password
   * @returns The user if the user exists and their password is correct
   * @throws If the user does not exist or if the password is incorrect
   */
  async getUserWithCredentials (userIdentity: IdentifyUserDTO, password: string): Promise<GetUserResponseDTO> {
    if (!isIdentifyUserDTO(userIdentity)) {
      throw new Error(UserService.Errors.MalformedRequest);
    }

    let user: IUser | null = null;

    if (typeof userIdentity === 'string') {
      user = await User.findById(stringToObjectId(userIdentity));
    } else {
      user = await User.findOne(userIdentity);
    }

    // Note: There is a potential timing-attack present here
    // We will respond faster when no user is found compared to when a user is found
    // An attacker could monitor our response time and note that we respond much faster
    // for some user identifiers compared to others, and use this to deduce that they
    // have discovered a user identifier that exists.
    // We could implement a constant-time response here if we want to avoid leaking that information.
    // The timing attack will be limited to the existence of a valid user identifier however
    // since the password comparison is performed by comparing hashes, so no useful information
    // will be leaked by timing differences there
    if (user) {
      if (await user.comparePassword(password)) {
        return userToGetUserResponseDTO(user);
      }
    }

    // Treat invalid password the same as not-found to make brute forcing more tedious
    throw new Error(UserService.Errors.UserNotFound);
  }
};

export default UserService;