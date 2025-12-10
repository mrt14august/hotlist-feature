export type Genre = 'Action' | 'Comedy' | 'Drama' | 'Fantasy' | 'Horror' | 'Romance' | 'SciFi';

export interface User {
  id: string;
  username: string;
  email: string;
  preferences: {
    favoriteGenres: Genre[];
    dislikedGenres: Genre[];
  };
  watchHistory: Array<{
    contentId: string;
    watchedOn: Date;
    rating?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genres: Genre[];
  releaseDate: Date;
  director: string;
  actors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TVShow {
  id: string;
  title: string;
  description: string;
  genres: Genre[];
  episodes: Array<{
    episodeNumber: number;
    seasonNumber: number;
    releaseDate: Date;
    director: string;
    actors: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MyListItem {
  userId: string;
  contentId: string;
  contentType: 'movie' | 'tvshow';
  content?: Movie | TVShow;
  addedAt: Date;
}
