import mongoose, { Schema, Document } from "mongoose";
import { Movie } from "../types";

interface IMovie extends Omit<Movie, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const movieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    genres: [
      {
        type: String,
        enum: [
          "Action",
          "Comedy",
          "Drama",
          "Fantasy",
          "Horror",
          "Romance",
          "SciFi",
        ],
        index: true,
      },
    ],
    releaseDate: { type: Date, required: true },
    director: { type: String, required: true, index: true },
    actors: [{ type: String }],
  },
  { timestamps: true }
);

export const MovieModel = mongoose.model<IMovie>("Movie", movieSchema);
