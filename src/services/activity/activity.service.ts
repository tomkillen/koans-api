import { Mongoose } from "mongoose";
import Activity, { ActivityInfo } from "./activity.model";
import objectIdToString from "../../helpers/objectIdToString";
import stringToObjectId from "../../helpers/stringToObjectId";

type CreateActivityDTO = ActivityInfo;
type UpdateActivityDTO = Partial<ActivityInfo>;
type GetActivityDTO = { id: string, created: Date } & ActivityInfo;

const ActivityServiceErrors = {
  ActivityNotFound: 'Activity not found',
  CategoryNotFound: 'Category not found',
};

class ActivityService {
  private readonly db: Mongoose;

  constructor(db: Mongoose) {
    this.db = db;
  }

  async prepare(): Promise<void> {
    // Ensure required models are initialized to avoid certain race conditions
    // Typically not an issue in production but this might mess with our tests.
    await Activity.init();
  }

  async createActivity(activityInfo: CreateActivityDTO): Promise<string> {
    return objectIdToString((await (await Activity.create(activityInfo)).save())._id);
  }

  async getActivity(id: string): Promise<GetActivityDTO> {
    const activity = await Activity.findById(stringToObjectId(id));
    if (!activity) {
      throw new Error(ActivityServiceErrors.ActivityNotFound);
    } else {
      return {
        id: objectIdToString(activity._id),
        created: activity._id.getTimestamp(),
        title: activity.title,
        category: activity.category,
        description: activity.description,
        duration: activity.duration,
        difficulty: activity.duration,
        content: activity.content,
      };
    }
  }

  async updateActivity(id: string, activityInfo: UpdateActivityDTO): Promise<void> {
    const result = await Activity.findByIdAndUpdate(stringToObjectId(id), activityInfo);
    if (!result) {
      throw new Error(ActivityServiceErrors.ActivityNotFound);
    }
  }

  async deleteActivity(id: string): Promise<void> {
    const result = await Activity.findByIdAndDelete(stringToObjectId(id));
    if (!result) {
      throw new Error(ActivityServiceErrors.ActivityNotFound);
    }
  }

  async deleteCategory(category: string): Promise<void> {
    const result = await Activity.deleteMany({ category });
    if (result.deletedCount === 0) {
      throw new Error(ActivityServiceErrors.CategoryNotFound);
    }
  }

  async renameCategory(oldCategory: string, newCategory: string): Promise<void> {
    const result = await Activity.updateMany({ category: oldCategory }, { category: newCategory });
    if (result.modifiedCount === 0) {
      throw new Error(ActivityServiceErrors.CategoryNotFound);
    }
  }
}

export default ActivityService;