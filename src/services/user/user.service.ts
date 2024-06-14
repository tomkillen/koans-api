import logger from "../../utilities/logger";

// Request DTO for creating a new user
export type CreateUserRequestDTO = {
  username: string;
  email: string;
  password: string;
};

// Request DTO for updating a users information
export type UpdateUserRequestDTO = {
  username?: string;
  email?: string;
  password?: string;
};

// Request DTO for identifying a user
export type IdentifyUserDTO = {
  /** identify user by id */
  id: string;
} | {
  /** identify user by username */
  username: string;
} | {
  /** identify user by email */
  email: string;
} | {
  /** identify user by id & password, e.g. for authenticating a user exists */
  id: string;
  password: string;
};

// Response DTO for getting a users information
export type GetUserResponseDTO = {
  id: string;
  username: string;
  email: string;
  created: string;
};

const UsersService = {
  /**
   * Creates a new user with the given username, email, & password
   * @param userData the user to be created
   * @returns the id of the created user
   * @throws if the user could not be created
   */
  createUser: async (userData: CreateUserRequestDTO): Promise<string> => {
    logger.error('users.service.createUser not yet implemented', userData);
    // TODO
    throw new Error('Not yet implemented');
  },

  /**
   * Deletes the user with the given id
   * @param userIdentity identifies the user to be deleted
   * @throws if the no user was deleted
   */
  deleteUser: async (userIdentity: IdentifyUserDTO): Promise<void> => {
    logger.error('users.service.deleteUser not yet implemented', userIdentity);
    // TODO
    throw new Error('Not yet implemented');
  },
  
  /**
   * Gets user information
   * @param userIdentity identifies the user we want information about
   * @returns information about the user
   * @throws if no information could be found for the identified user
   */
  getUser: async (userIdentity: IdentifyUserDTO): Promise<GetUserResponseDTO | null> => {
    logger.error('users.service.getUser not yet implemented', userIdentity);
    // TODO
    throw new Error('Not yet implemented');
  },

  /**
   * Updates the identified user with the given user data
   * @param userIdentity identifies the user to be updated
   * @param userData the changes to patch into the user
   * @throws if no user data was changed
   */
  updateUser: async (userIdentity: IdentifyUserDTO, userData: UpdateUserRequestDTO): Promise<void> => {
    logger.error('users.service.updateUser not yet implemented', userIdentity, userData);
    // TODO
    throw new Error('Not yet implemented');
  },
};

export default UsersService;