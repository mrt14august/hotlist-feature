import mongoose, { Schema, Document } from 'mongoose';
import { TVShow } from '../types';

interface ITVShow extends Omit<TVShow, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const episodeSchema = new Schema(
  {
    episodeNumber: { type: Number, required: true },
    seasonNumber: { type: Number, required: true },
    releaseDate: { type: Date, required: true },
    director: { type: String, required: true },
    actors: [{ type: String }]
  },
  { _id: false }
);

const tvShowSchema = new Schema<ITVShow>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    genres: [{ type: String, enum: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'SciFi'], index: true }],
    episodes: [episodeSchema]
  },
  { timestamps: true }
);

export const TVShowModel = mongoose.model<ITVShow>('TVShow', tvShowSchema);
