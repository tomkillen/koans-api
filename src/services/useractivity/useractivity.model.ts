import { Model, Schema, Types, model } from "mongoose";
import { ActivityInfo } from "../activity/activity.model";

// Copy of an activity that is relevant for a specific user
// Use the strategy of copying documents to make reads more efficient
// since modifying & deleting activities should be far more rare
export type IUserActivity = {
  /** record Id */
  _id: Types.ObjectId;
  /** Id of the User this record relates to */
  userId: Types.ObjectId;
  /** Id of the activity this record relates to */
  activityId: Types.ObjectId;
} & Document & ActivityInfo;

// Play loose with validation since we are maintaining cached copies
// of already defined activities, so avoid adding extra validation rules
// here unless absolutely necessary since we should consider this a dumb cache.
// The presence of a UserActivity record indicates the activity is completed
// for that user, so there is also no need for indexing field
// except for userId & activityId to enable querying efficiently
const UserActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  activityId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  title: {
    type: String,
  },
  category: {
    type: String,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
  },
  difficulty: {
    type: Number,
  },
  content: {
    type: String,
  },
});

// Create a unique compound index on userId and activityId
// Prevents inserting the same activity more than once per user
UserActivitySchema.index({ userId: 1, activityId: 1 }, { unique: true });

const UserActivity: Model<IUserActivity> = model('UserActivity', UserActivitySchema);

export default UserActivity;
