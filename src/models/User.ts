import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../types';

interface IUser extends Omit<User, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const watchHistorySchema = new Schema(
  {
    contentId: { type: String, required: true },
    watchedOn: { type: Date, required: true },
    rating: { type: Number, min: 0, max: 10 }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    preferences: {
      favoriteGenres: [{ type: String, enum: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'SciFi'] }],
      dislikedGenres: [{ type: String, enum: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'SciFi'] }]
    },
    watchHistory: [watchHistorySchema]
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
