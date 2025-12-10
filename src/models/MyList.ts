import mongoose, { Schema, Document } from 'mongoose';
import { MyListItem } from '../types';

interface IMyListItem extends Omit<MyListItem, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const myListSchema = new Schema<IMyListItem>(
  {
    userId: { type: String, required: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: { type: String, enum: ['movie', 'tvshow'], required: true, index: true },
    addedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

// Create compound index for userId and contentId to ensure uniqueness
myListSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export const MyListModel = mongoose.model<IMyListItem>('MyList', myListSchema);
