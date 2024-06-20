import { Model, Document, Schema, model, Types } from "mongoose";
import UserActivity from "../useractivity/useractivity.model";

const ActivityValidationErrors = {
  Title: {
    Missing: 'Missing title',
    Malformed: 'Malformed title',
  },
  Category: {
    Missing: 'Missing category',
    Malformed: 'Malformed category',
  },
  Description: {
    Missing: 'Missing description',
    Malformed: 'Malformed description',
  },
  Duration: {
    Missing: 'Missing duration',
    Malformed: 'Malformed duration',
    Invalid: 'Invalid duration',
  },
  Difficulty: {
    Missing: 'Missing difficulty',
    Malformed: 'Malformed difficulty',
    Invalid: 'Invalid difficulty',
  },
  Content: {
    Missing: 'Missing content',
    Malformed: 'Malformed content',
  },
}

export type ActivityInfo = {
  title: string;
  category: string;
  description: string;
  duration: number;
  difficulty: number;
  content: string;
};

export type IActivity = {
  _id: Types.ObjectId;
} & Document & ActivityInfo;

type IActivityModel = {
  deleteByCategory: (category: string) => Promise<number>;
} & Model<IActivity>;

const ActivitySchema = new Schema<IActivity, IActivityModel>({
  title: {
    type: String,
    required: [ true, ActivityValidationErrors.Title.Missing ],
    index: {
      // we rely on users of the service calling ActivityService.prepare before
      // creating users to avoid the race condition that exists while the index
      // is being built
      unique: true,
      // Case insenstive index
      collation: { locale: 'en', strength: 1 },
    },
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(ActivityValidationErrors.Title.Malformed);
        }
        if (value.length === 0) {
          throw new Error(ActivityValidationErrors.Title.Missing);
        }
        return true;
      },
    },
  },
  category: {
    type: String,
    required: [ true, ActivityValidationErrors.Category.Missing ],
    index: {
      // Case insenstive index
      collation: { locale: 'en', strength: 1 },
    },
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(ActivityValidationErrors.Category.Malformed);
        }
        if (value.length === 0) {
          throw new Error(ActivityValidationErrors.Category.Missing);
        }
        return true;
      },
    },
  },
  description: {
    type: String,
    required: [ true, ActivityValidationErrors.Description.Missing ],
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(ActivityValidationErrors.Description.Malformed);
        }
        if (value.length === 0) {
          throw new Error(ActivityValidationErrors.Description.Missing);
        }
        return true;
      },
    },
  },
  duration: {
    type: Number,
    required: [ true, ActivityValidationErrors.Duration.Missing ],
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'number' || value !== parseInt(value.toString())) {
          throw new Error(ActivityValidationErrors.Duration.Malformed);
        }
        if (value < 0) {
          throw new Error(ActivityValidationErrors.Duration.Invalid);
        }
        return true;
      },
    },
  },
  difficulty: {
    type: Number,
    required: [ true, ActivityValidationErrors.Difficulty.Missing ],
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'number' || value !== parseInt(value.toString())) {
          throw new Error(ActivityValidationErrors.Difficulty.Malformed);
        }
        if (value < 0) {
          throw new Error(ActivityValidationErrors.Difficulty.Invalid);
        }
        return true;
      },
    },
  },
  content: {
    type: String,
    required: [ true, ActivityValidationErrors.Content.Missing ],
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(ActivityValidationErrors.Content.Malformed);
        }
        if (value.length === 0) {
          throw new Error(ActivityValidationErrors.Content.Missing);
        }
        return true;
      },
    },
  },
});

// Bulk text search index
// Insertions & Updates become more expensive operations
// but these should be rare compared to searching & filtering
// so it's worth optimizing our search performance over inserts/updates
ActivitySchema.index({
  title: 'text',
  category: 'text',
  description: 'text',
  content: 'text',
}, {
  name: 'text',
  // collation: { locale: 'en', strength: 1 },
  weights: {
    // Fibonacci weighting for more prominent fields is a decent guess
    title: 13,
    category: 8,
    description: 5,
    content: 3,
  },
});

// Middleware to handle cascading deletion of UserActivity when deleting an activity by _id
ActivitySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    await UserActivity.deleteMany({ userId: this._id });
    next();
  } catch (err) {
    next(new Error(`Error deleting UserActivitiys ${err}`));
  }
});

// Middleware to handle cascading deletions of UserActivity when deleting many Activity's by query
ActivitySchema.pre('deleteMany', { document: true, query: true }, async function (next) {
  try {
    const category: string | undefined = this.getFilter()['category'];
    if (category) {
      await UserActivity.deleteMany({ category });
      next();
    } else {
      // If we want to deleteMany by other queries or filters, add the support
      // to also delete UserActivity's
      next(new Error(`deleteMany Activities only supported by category`));
    }
  } catch (err) {
    next(new Error(`Error deleting UserActivitiys ${err}`));
  }
});


// schema.index({ 
//   animal: 'text', color: 'text', pattern: 'text', size: 'text' }, 
//   {name: 'My text index', weights: {animal: 10, color: 4, pattern: 2, size: 1}})

const Activity: Model<IActivity, IActivityModel> = model('Activity', ActivitySchema);

export default Activity;