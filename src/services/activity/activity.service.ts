import mongoose, { Expression, FilterQuery, Mongoose, PipelineStage, SortOrder } from "mongoose";
import Activity, { ActivityInfo, IActivity } from "./activity.model";
import objectIdToString from "../../helpers/objectIdToString";
import stringToObjectId from "../../helpers/stringToObjectId";
import { NumberOrRange, numberOrRangeToNumberFilter, sortOrder, textSearchFromSearchString } from "../../helpers/mongoQuery";
import logger from "../../utilities/logger";

export type ActivitiesSortByKey = 'created' | 'title' | 'category' | 'duration' | 'difficulty';
export type ActivitiesSortBy = {
  key: ActivitiesSortByKey;
  direction: SortOrder;
}

export type CreateActivityRequestDTO = ActivityInfo;
export type UpdateActivityRequestDTO = Partial<ActivityInfo>;
export type GetActivityResponseDTO = { id: string, created: Date } & ActivityInfo;
export type GetActivitiesResponseDTO = {
  /** List of activities found by the GetActivitiesRequestDTO */
  activities: GetActivityResponseDTO[],
  /** Pagination */
  page: number;
  pageSize: number;
  /** Total number of results available */
  total: number;
};
export type GetActivitiesRequestDTO = {
  /**
   * Search title, category, description, and content by keyword(s)
   * Group terms by quotes, e.g. `"fitness first" for men`
   */
  searchTerm?: string;
  /** Filter by category(s) */
  category?: string | string[];
  /** Filter by difficulty or difficulty range */
  difficulty?: NumberOrRange;
  /** Filter by duration or duration range */
  duration?: NumberOrRange;
  /** Pagination */
  page?: number;
  pageSize?: number;
  /** Sorting, nested from first as highest sort order (0) to Nth */
  sortBy?: ActivitiesSortBy | ActivitiesSortBy[];
};
export type GetCategoryResponseDTO = {
  /** Name of the category */
  name: string;
  /** Number of activities in the category */
  count: number;
};
export type GetCategoriesRequestDTO = {
  /** Pagination */
  page?: number;
  pageSize?: number;
  /** Sorting */
  order?: SortOrder;
};
export type GetCategoriesResponseDTO = {
  /** List of activities found by the GetCategoriesRequestDTO */
  categories: GetCategoryResponseDTO[],
  /** Pagination */
  page: number;
  pageSize: number;
  /** Total number of results available */
  total: number;
};

class ActivityService {
  public static readonly Errors = {
    TitleConflict: 'An activity with that title already exists',
    ActivityNotFound: 'Activity not found',
    CategoryNotFound: 'Category not found',
  };

  private readonly db: Mongoose;

  constructor(db: Mongoose) {
    this.db = db;
  }

  async prepare(): Promise<void> {
    // Ensure required models are initialized to avoid certain race conditions
    // Typically not an issue in production but this might mess with our tests.
    await Activity.init();
  }

  async createActivity(activityInfo: CreateActivityRequestDTO): Promise<string> {
    try {
      return objectIdToString((await (await Activity.create({
        title: activityInfo.title,
        category: activityInfo.category,
        description: activityInfo.description,
        duration: activityInfo.duration,
        difficulty: activityInfo.difficulty,
        content: activityInfo.content,
      })).save())._id);
    } catch (err) {
      if (err instanceof mongoose.mongo.MongoServerError &&
        err.code == '11000' &&
        err['keyPattern'] &&
        'title' in err['keyPattern']
      ) {
        // This was a title collision, so throw our own error
        throw new Error(ActivityService.Errors.TitleConflict)
      } else {
        // Unhandled error, rethrow
        throw err;
      }
    }
  }

  async getActivity(id: string): Promise<GetActivityResponseDTO> {
    const activity = await Activity.findById(stringToObjectId(id));
    if (!activity) {
      throw new Error(ActivityService.Errors.ActivityNotFound);
    } else {
      return this.activityToGetActivityResponseDTO(activity);
    }
  }

  async getActivities(query?: GetActivitiesRequestDTO): Promise<GetActivitiesResponseDTO> {
    const pipeline: PipelineStage[] = [];

    // Filtering & searching
    const filters: FilterQuery<IActivity>[] = [];
    
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
    const result = await Activity.aggregate<{ metadata: [{ total: number }], data: IActivity[] }>(pipeline);
    return {
      page,
      pageSize,
      total: result[0]?.metadata[0]?.total ?? 0,
      activities: result[0]?.data.map(this.activityToGetActivityResponseDTO) ?? [],
    };
  }

  async getCategories(query?: GetCategoriesRequestDTO): Promise<GetCategoriesResponseDTO> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const result = await Activity.aggregate<{
      total: number,
      categories: { _id: string, count: number }[],
    }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $facet: {
          total: [ { $group: { _id: null, total: { $sum: 1 } } } ],
          result: [
            { $sort: { _id: sortOrder(query?.order ?? 1) } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
      { $project: { total: { $arrayElemAt: ["$total.total", 0] }, categories: "$result" } }
    ]);

    return {
      page,
      pageSize,
      total: result[0]?.total,
      categories: result[0]?.categories.map(category => ({
        name: category._id,
        count: category.count,
      })) ?? [],
    };
  }

  async updateActivity(id: string, activityInfo: UpdateActivityRequestDTO): Promise<void> {
    try {
      const result = await Activity.updateOne({ _id: stringToObjectId(id) }, {
        title: activityInfo.title,
        category: activityInfo.category,
        description: activityInfo.description,
        duration: activityInfo.duration,
        difficulty: activityInfo.difficulty,
        content: activityInfo.content,
      });
      if (result.modifiedCount === 0) {
        throw new Error(ActivityService.Errors.ActivityNotFound);
      }
    } catch (err) {
      if (err instanceof mongoose.mongo.MongoServerError &&
        err.code == '11000' &&
        err['keyPattern'] &&
        'title' in err['keyPattern']
      ) {
        // This was a title collision, so throw our own error
        throw new Error(ActivityService.Errors.TitleConflict)
      } else {
        // Unhandled error, rethrow
        throw err;
      }
    }
  }

  async deleteActivity(id: string): Promise<void> {
    const result = await Activity.deleteOne({ _id: stringToObjectId(id) });
    if (result.deletedCount === 0) {
      throw new Error(ActivityService.Errors.ActivityNotFound);
    }
  }

  async deleteCategory(category: string): Promise<number> {
    const result = await Activity.deleteMany({ category });
    if (result.deletedCount === 0) {
      throw new Error(ActivityService.Errors.CategoryNotFound);
    }
    return result.deletedCount;
  }

  async renameCategory(oldCategory: string, newCategory: string): Promise<number> {
    const result = await Activity.updateMany({ category: oldCategory }, { category: newCategory });
    if (result.modifiedCount === 0) {
      throw new Error(ActivityService.Errors.CategoryNotFound);
    }
    return result.modifiedCount;
  }

  private activityToGetActivityResponseDTO(activity: IActivity) {
    return {
      id: objectIdToString(activity._id),
      created: activity._id.getTimestamp(),
      title: activity.title,
      category: activity.category,
      description: activity.description,
      duration: activity.duration,
      difficulty: activity.difficulty,
      content: activity.content,
    };
  };
}

export default ActivityService;