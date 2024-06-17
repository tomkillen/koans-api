import { Model, Document, Schema, model, Types } from "mongoose";

// bcrypt is a decent balance between hardness and processing intensivity
// maybe not "military grade" but it's pretty good
import bcrypt from 'bcrypt';

// 10 salt rounds are recommended to stay above GPU cracking capabilities
// but it comes at a cost. 10 rounds means ~10 hashes per second, whereas 8 
// rounds gives ~40 hashes per sec, so increasing the number of rounds has
// a very direct performance penalty that quickly becomes significant.
const SaltRounds = 10;

// Make it easier to check which errors have been thrown by using constants
// Useful in tests to verify we get the "correct" errors
// Useful for reporting to the control layer what went wrong
// Useful for reporting useable feedback to the user
export const UserValidationErrors = {
  Username: {
    Missing: 'username is required',
    Empty: 'username cannot be empty',
    Malformed: 'username is malformed',
  },
  Email: {
    Missing: 'email is required',
    Empty: 'email cannot be empty',
    Malformed: 'email is malformed',
  },
  Password: {
    Missing: 'password is required',
    Empty: 'password cannot be empty',
    Malformed: 'password is malformed',
  },
};

export type IUser = {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  roles?: string[];
  comparePassword: (compareTo: string) => Promise<boolean>;
} & Document;


    // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
const UserSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: [ true, UserValidationErrors.Username.Missing ],
    index: {
      // we rely on users of the service calling UserService.prepare before
      // creating users to avoid the race condition that exists while the index
      // is being built
      unique: true,
      // Case insenstive index
      collation: { locale: 'en', strength: 2 },
    },
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(UserValidationErrors.Username.Malformed);
        }
        if (value.length === 0) {
          throw new Error(UserValidationErrors.Username.Empty);
        }
        return true;
      },
    },
  },
  email: {
    type: String,
    required: [ true, UserValidationErrors.Email.Missing ],
    index: {
      // we rely on users of the service calling UserService.prepare before
      // creating users to avoid the race condition that exists while the index
      // is being built
      unique: true,
      // Case insenstive index
      collation: { locale: 'en', strength: 2 },
    },
    validate: {
      validator: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new Error(UserValidationErrors.Email.Malformed);
        }
        if (value.length === 0) {
          throw new Error(UserValidationErrors.Email.Malformed);
        }
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
          throw new Error(UserValidationErrors.Email.Malformed);
        }
        return true;
      },
    },
  },
  password: {
    type: String,
    required: [ true, UserValidationErrors.Password.Missing ],
    validate: {
      validator: (value: unknown): boolean => {
        if (typeof value !== 'string') {
          throw new Error(UserValidationErrors.Password.Malformed);
        }
        if (value.length === 0) {
          throw new Error(UserValidationErrors.Password.Empty);
        }
        return true;
      },
    },
  },
});

UserSchema.pre('save', async function(next) {
  // Only hash the password if it is new or modified
  if (this.isModified('password')) {
    try {
      // Use async hash and bcrypt can perform the hash on a background threadpool
      // which significantly mitigates the performance impact of hashing on the server
      this.password = await bcrypt.hash(this.password, SaltRounds);
    } catch (err) {
      if (err instanceof Error) {
        return next(err);
      } else if (typeof err === 'string') {
        return next(new Error(err));
      } else {
        return next(new Error(`Error saving user: ${err}`));
      }
    }
  }

  // Success, proceed
  next();
});

// findByIdAndUpdate is equivalent to findOneAndUpdate({ _id: id } ...
// so both findBy_AndUpdate are handled here
UserSchema.pre( 'findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update && 'password' in update) {
    update['password'] = await bcrypt.hash(update.password, SaltRounds);
  }
  
  next();
});

UserSchema.methods.comparePassword = function(testPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (this.isModified('password')) {
      reject(new Error(`password not yet saved`));
    }
    bcrypt.compare(testPassword, this.password, (err, same) => {
      if (err) {
        reject(err);
      } else {
        resolve(same);
      }
    });
  });
};

const User: Model<IUser> = model('User', UserSchema);

export default User;