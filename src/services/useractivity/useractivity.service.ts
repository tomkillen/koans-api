import mongoose, { Expression, FilterQuery, Mongoose, PipelineStage, Types, isObjectIdOrHexString } from "mongoose";
import UserActivity, { IUserActivity } from "./useractivity.model";
import { GetActivitiesRequestDTO, GetActivitiesResponseDTO, GetActivityResponseDTO, activityToGetActivityResponseDTO } from "../activity/activity.service";
import Activity from "../activity/activity.model";
import User from "../user/user.model";
import { numberOrRangeToNumberFilter, sortOrder, textSearchFromSearchString } from "../../helpers/mongoQuery";
import objectIdToString from "../../helpers/objectIdToHexString";

// Refers to an id type
// - string => value is an objectId as hex string
// - { id: string } => value.id is an objectId as hex string
// - Types.ObjectId => value is an ObjectId
// - { _id: Types.ObjectId } => value._id is an ObjectId
type Identifier = Types.ObjectId | {
  id: string;
} | {
  _id: Types.ObjectId;
} | string;

/**
 * Converts an Identifier to an ObjectId
 * @param value value to converted to an ObjectId
 * @param useErrorMessage which error to throw on failure
 * @returns value as an ObjectId
 */
const identifierToObjectId = (value: Identifier, useErrorMessage: string): Types.ObjectId => {
  if (typeof value === 'string' && isObjectIdOrHexString(value)) {
    return Types.ObjectId.createFromHexString(value);
  } else if (value instanceof Types.ObjectId) {
    return value;
  } else if (typeof value === 'object' && '_id' in value && value._id instanceof Types.ObjectId) {
    return value._id;
  } else if (typeof value === 'object' && 'id' in value && typeof value.id == 'string' && isObjectIdOrHexString(value.id)) {
    return Types.ObjectId.createFromHexString(value.id);
  }

  throw new Error(useErrorMessage);
}

class UserActivityService {
  public static readonly Errors = {
    UserNotFound: 'User not found',
    InvalidUserId: 'Invalid user id',
    ActivityNotFound: 'Activity not found',
    InvalidActivityId: 'Invalid activity id',
    AlreadyComplete: 'Activity already completed',
    AlreadyNotComplete: 'Activity already uncompleted',
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
    await UserActivity.init();
  }

  async getUserActivity(userIdentier: Identifier, activityIdentifier: Identifier): Promise<GetActivityResponseDTO | null> {
    const userId = identifierToObjectId(userIdentier, UserActivityService.Errors.InvalidUserId);
    const activityId = identifierToObjectId(activityIdentifier, UserActivityService.Errors.InvalidActivityId);
    const result = await UserActivity.findOne({ userId, activityId });
    if (result) {
      const response = activityToGetActivityResponseDTO(result);
      response.id = objectIdToString(activityId);
      return response;
    }

    return null;
  }

  async isActivityComplete(userIdentier: Identifier, activityIdentifier: Identifier): Promise<boolean> {
    return (await this.getUserActivity(userIdentier, activityIdentifier)) !== null;
  }

  async getCompletedActivities(userIdentier: Identifier, query?: GetActivitiesRequestDTO): Promise<GetActivitiesResponseDTO> {
    const userId = identifierToObjectId(userIdentier, UserActivityService.Errors.InvalidUserId);
    const pipeline: PipelineStage[] = [];

    // Filtering & searching
    const filters: FilterQuery<IUserActivity>[] = [];

    filters.push({ userId })
    
    if (query?.difficulty !== undefined) {
      filters.push({ difficulty: numberOrRangeToNumberFilter(query.difficulty) })
    }
    if (query?.duration !== undefined) {
      filters.push({ duration: numberOrRangeToNumberFilter(query.duration) });
    }
    if (query?.category) {
      if (Array.isArray(query.category)) {
        filters.push({ category: { $in: query.category }});
      } else {
        filters.push({ category: { $eq: query.category }});
      }
    }
    if (query?.searchTerm?.trim()) {
      filters.push({ $text: textSearchFromSearchString(query.searchTerm.trim()) });
    }

    if (filters.length === 1) {
      pipeline.push({ $match: filters[0] });
    } else if (filters.length > 1) {
      pipeline.push({ $match: { $and: filters } });
    }

    // Sorting
    const sort: { [ key: string ]: 1 | -1 | Expression.Meta } = {};
    if (query?.sortBy) {
      if (Array.isArray(query.sortBy)) {
        query.sortBy.forEach(sortBy => {
          sort[sortBy.key] = sortOrder(sortBy.direction);
        });
      } else {
        sort[query.sortBy.key] = sortOrder(query.sortBy.direction);
      }
      // If we have some keywords, add an additional next sort by text score
      if (query.searchTerm) {
        sort.score = { $meta: "textScore" };
      }
    } else {
      // If we have some keywords to search by, default to sorting by text score
      // otherwise default to sorting by title ascending
      if (query?.searchTerm) {
        sort.score = { $meta: "textScore" };
      } else {
        sort.title = 1;
      }
    }
    pipeline.push({ $sort: sort });

    // Pagination

    // Default to page 1 and pageSize of 20
    // Don't allow negative page or pageSize
    const page = Math.max(query?.page ?? 1, 1);
    const pageSize = Math.max(query?.pageSize ?? 20, 1);

    pipeline.push({ 
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [ 
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize }
        ]
      }
    });

    // Execution
    const result = await UserActivity.aggregate<{ metadata: [{ total: number }], data: IUserActivity[] }>(pipeline);
    return {
      page,
      pageSize,
      total: result[0]?.metadata[0]?.total ?? 0,
      activities: result[0]?.data.map(activityToGetActivityResponseDTO) ?? [],
    };
  }

  async completeActivity(userIdentier: Identifier, activityIdentifier: Identifier): Promise<void> {
    const userId = identifierToObjectId(userIdentier, UserActivityService.Errors.InvalidUserId);
    const activityId = identifierToObjectId(activityIdentifier, UserActivityService.Errors.InvalidActivityId);

    // Ensure user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(UserActivityService.Errors.UserNotFound);
    }

    // Ensure activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      throw new Error(UserActivityService.Errors.ActivityNotFound);
    }

    try {
      await UserActivity.create({
        userId,
        activityId,
        title: activity.title,
        category: activity.category,
        description: activity.description,
        duration: activity.duration,
        difficulty: activity.difficulty,
        content: activity.content,
      });
    } catch (err) {
      if (err instanceof mongoose.mongo.MongoServerError && err.code == '11000') {
        throw new Error(UserActivityService.Errors.AlreadyComplete);
      } else {
        // Unhandled error, rethrow
        throw err;
      }
    }
  }

  async uncompleteActivity(userIdentier: Identifier, activityIdentifier: Identifier): Promise<void> {
    const userId = identifierToObjectId(userIdentier, UserActivityService.Errors.InvalidUserId);
    const activityId = identifierToObjectId(activityIdentifier, UserActivityService.Errors.InvalidActivityId);
    const deletionResult = await UserActivity.deleteMany({ userId, activityId });
    if (deletionResult.deletedCount === 0) {
      throw new Error(UserActivityService.Errors.AlreadyNotComplete);
    }
  }
}

export default UserActivityService;