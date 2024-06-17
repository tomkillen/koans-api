import { Mongoose } from "mongoose";
import User, { IUser, UserValidationErrors } from "./user.model";
import objectIdToString from "../../helpers/objectIdToString";
import stringToObjectId from "../../helpers/stringToObjectId";
import Role from "../auth/auth.roles";

// Request DTO for creating a new user
export type CreateUserRequestDTO = {
  username: string;
  email: string;
  password: string;
  roles?: Role[];
};

// Request DTO for updating a users information
export type UpdateUserRequestDTO = {
  username?: string;
  email?: string;
  password?: string;
  roles?: Role[];
};

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

// Response DTO for getting a users information
export type GetUserResponseDTO = {
  id: string;
  username: string;
  email: string;
  created: Date;
  roles?: Role[];
};

export const UserServiceErrors = {
  UserNotFound: 'user not found',

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
  };
}

class UserService {
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
    return objectIdToString((await (await User.create(userData)).save())._id);
  }

  /**
   * Deletes the user with the given id
   * @param userIdentity identifies the user to be deleted
   * @throws if the no user was deleted
   */
  async deleteUser (userIdentity: IdentifyUserDTO | string): Promise<void> {
    if (typeof userIdentity === 'string') {
      const deleted = await User.findByIdAndDelete(stringToObjectId(userIdentity));
      if (!deleted) {
        throw new Error(UserServiceErrors.UserNotFound);
      }
    } else if ('username' in userIdentity || 'email' in userIdentity) {
      const deleted = await User.findOneAndDelete(userIdentity);
      if (!deleted) {
        throw new Error(UserServiceErrors.UserNotFound);
      }
    } else {
      throw new Error(UserServiceErrors.UserNotFound);
    }
  }
  
  /**
   * Gets user information
   * @param userIdentity identifies the user we want information about
   * @returns information about the user
   */
  async getUser (userIdentity: IdentifyUserDTO): Promise<GetUserResponseDTO | null> {
    // I happen to like non-nested tuples. I understand that nested tuples become a mess
    // but I personally find this more readable than if statements, so long as they are 
    // 1-deep & neatly arranged like this.
    const user = await ((typeof userIdentity === 'string') 
      ? User.findById(stringToObjectId(userIdentity)) 
      : User.findOne(userIdentity));

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
    // I happen to like non-nested tuples. I understand that nested tuples become a mess
    // but I personally find this more readable than if statements, so long as they are 
    // 1-deep & neatly arranged like this.
    // You can disagree. But look at how neat & tidy this is when separated onto new lines.
    const user = await ((typeof userIdentity === 'string') 
      ? User.findById(stringToObjectId(userIdentity)) 
      : User.findOne(userIdentity));

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
    throw new Error(UserServiceErrors.UserNotFound);
  }

  /**
   * Updates the identified user with the given user data
   * @param userIdentity identifies the user to be updated
   * @param userData the changes to patch into the user
   * @returns the updated user data
   * @throws if no user data was changed
   */
  async updateUser (userIdentity: IdentifyUserDTO, userData: UpdateUserRequestDTO): Promise<GetUserResponseDTO> {
    if (typeof userIdentity === 'string') {
      const result = await User.findByIdAndUpdate(stringToObjectId(userIdentity), userData);
      if (result) {
        return userToGetUserResponseDTO(result);
      } else {
        throw new Error(UserServiceErrors.UserNotFound);
      }
    } else {
      const result = await User.findOneAndUpdate(userIdentity, userData);
      if (result) {
        return userToGetUserResponseDTO(result);
      } else {
        throw new Error(UserServiceErrors.UserNotFound);
      }
    }
  }
};

export default UserService;