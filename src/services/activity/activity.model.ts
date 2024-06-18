import { Model, Document, Schema, model, Types } from "mongoose";

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

const ActivitySchema: Schema<IActivity> = new Schema({
  title: {
    type: String,
    required: [ true, ActivityValidationErrors.Title.Missing ],
    index: {
      // we rely on users of the service calling ActivityService.prepare before
      // creating users to avoid the race condition that exists while the index
      // is being built
      unique: true,
      // Case insenstive index
      collation: { locale: 'en', strength: 2 },
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
      collation: { locale: 'en', strength: 2 },
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

const Activity: Model<IActivity> = model('Activity', ActivitySchema);

export default Activity;