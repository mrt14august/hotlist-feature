import { connectDatabase, disconnectDatabase } from '../db/mongo';
import { UserModel } from '../models/User';
import { MovieModel } from '../models/Movie';
import { TVShowModel } from '../models/TVShow';
import { MyListModel } from '../models/MyList';

const seedDatabase = async () => {
  try {
    await connectDatabase();
    console.log('Connected to database');

    // Clear existing data
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await TVShowModel.deleteMany({});
    await MyListModel.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await UserModel.insertMany([
      {
        username: 'john_doe',
        email: 'john@example.com',
        preferences: {
          favoriteGenres: ['Action', 'SciFi'],
          dislikedGenres: ['Horror']
        },
        watchHistory: [
          {
            contentId: 'movie1',
            watchedOn: new Date('2024-01-15'),
            rating: 8
          }
        ]
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        preferences: {
          favoriteGenres: ['Drama', 'Romance'],
          dislikedGenres: ['Comedy']
        },
        watchHistory: []
      },
      {
        username: 'test_user',
        email: 'test@example.com',
        preferences: {
          favoriteGenres: ['Action', 'Comedy', 'SciFi'],
          dislikedGenres: []
        },
        watchHistory: []
      }
    ]);
    console.log(`Created ${users.length} users`);

    // Create sample movies
    const movies = await MovieModel.insertMany([
      {
        title: 'The Matrix',
        description: 'A computer programmer discovers that reality is a simulation',
        genres: ['SciFi', 'Action'],
        releaseDate: new Date('1999-03-31'),
        director: 'Lana Wachowski, Lilly Wachowski',
        actors: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss']
      },
      {
        title: 'Inception',
        description: 'A skilled thief who steals corporate secrets through dream-sharing technology',
        genres: ['SciFi', 'Action', 'Drama'],
        releaseDate: new Date('2010-07-16'),
        director: 'Christopher Nolan',
        actors: ['Leonardo DiCaprio', 'Marion Cotillard', 'Ellen Page']
      },
      {
        title: 'Titanic',
        description: 'An epic romance and disaster film about the sinking of the RMS Titanic',
        genres: ['Romance', 'Drama'],
        releaseDate: new Date('1997-12-19'),
        director: 'James Cameron',
        actors: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane']
      },
      {
        title: 'The Shining',
        description: 'A family isolated in a snowbound hotel confronts supernatural forces and each other',
        genres: ['Horror', 'Drama'],
        releaseDate: new Date('1980-05-23'),
        director: 'Stanley Kubrick',
        actors: ['Jack Nicholson', 'Shelley Duvall', 'Danny Lloyd']
      },
      {
        title: 'Forrest Gump',
        description: 'The life story of a man with a low IQ but a good heart',
        genres: ['Comedy', 'Drama'],
        releaseDate: new Date('1994-07-06'),
        director: 'Robert Zemeckis',
        actors: ['Tom Hanks', 'Gary Sinise', 'Sally Field']
      },
      {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space to save humanity',
        genres: ['SciFi', 'Drama', 'Action'],
        releaseDate: new Date('2014-11-07'),
        director: 'Christopher Nolan',
        actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain']
      },
      {
        title: 'The Dark Knight',
        description: 'Batman faces a new nemesis: the Joker, a criminal mastermind',
        genres: ['Action', 'Drama'],
        releaseDate: new Date('2008-07-18'),
        director: 'Christopher Nolan',
        actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart']
      },
      {
        title: 'Pulp Fiction',
        description: 'The lives of two mob hitmen, a boxer, a gangster\'s wife, and a pair of diner bandits intertwine',
        genres: ['Drama', 'Action'],
        releaseDate: new Date('1994-10-14'),
        director: 'Quentin Tarantino',
        actors: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman']
      }
    ]);
    console.log(`Created ${movies.length} movies`);

    // Create sample TV shows
    const tvshows = await TVShowModel.insertMany([
      {
        title: 'Breaking Bad',
        description: 'A high school chemistry teacher turned meth kingpin',
        genres: ['Drama', 'Action'],
        episodes: [
          {
            episodeNumber: 1,
            seasonNumber: 1,
            releaseDate: new Date('2008-01-20'),
            director: 'Vince Gilligan',
            actors: ['Bryan Cranston', 'Aaron Paul']
          },
          {
            episodeNumber: 2,
            seasonNumber: 1,
            releaseDate: new Date('2008-01-27'),
            director: 'Vince Gilligan',
            actors: ['Bryan Cranston', 'Aaron Paul']
          }
        ]
      },
      {
        title: 'Game of Thrones',
        description: 'Noble families vie for control of the Seven Kingdoms',
        genres: ['Fantasy', 'Drama', 'Action'],
        episodes: [
          {
            episodeNumber: 1,
            seasonNumber: 1,
            releaseDate: new Date('2011-04-17'),
            director: 'Tim Van Patten',
            actors: ['Emilia Clarke', 'Kit Harington', 'Lena Headey']
          },
          {
            episodeNumber: 2,
            seasonNumber: 1,
            releaseDate: new Date('2011-04-24'),
            director: 'Tim Van Patten',
            actors: ['Emilia Clarke', 'Kit Harington', 'Lena Headey']
          }
        ]
      },
      {
        title: 'Stranger Things',
        description: 'When a young boy disappears, friends discover weird clues and forces',
        genres: ['SciFi', 'Drama', 'Horror'],
        episodes: [
          {
            episodeNumber: 1,
            seasonNumber: 1,
            releaseDate: new Date('2016-07-15'),
            director: 'The Duffer Brothers',
            actors: ['Winona Ryder', 'David Harbour', 'Finn Wolfhard']
          }
        ]
      },
      {
        title: 'The Office',
        description: 'A mockumentary about everyday office workers',
        genres: ['Comedy'],
        episodes: [
          {
            episodeNumber: 1,
            seasonNumber: 1,
            releaseDate: new Date('2005-03-24'),
            director: 'Greg Daniels',
            actors: ['Steve Carell', 'Rainn Wilson', 'John Krasinski']
          }
        ]
      }
    ]);
    console.log(`Created ${tvshows.length} TV shows`);

    // Create sample MyList items
    const myListItems = await MyListModel.insertMany([
      {
        userId: users[0]._id.toString(),
        contentId: movies[0]._id.toString(),
        contentType: 'movie',
        addedAt: new Date('2024-01-20')
      },
      {
        userId: users[0]._id.toString(),
        contentId: movies[1]._id.toString(),
        contentType: 'movie',
        addedAt: new Date('2024-01-21')
      },
      {
        userId: users[0]._id.toString(),
        contentId: tvshows[0]._id.toString(),
        contentType: 'tvshow',
        addedAt: new Date('2024-01-22')
      },
      {
        userId: users[1]._id.toString(),
        contentId: movies[2]._id.toString(),
        contentType: 'movie',
        addedAt: new Date('2024-01-20')
      },
      {
        userId: users[1]._id.toString(),
        contentId: tvshows[1]._id.toString(),
        contentType: 'tvshow',
        addedAt: new Date('2024-01-21')
      }
    ]);
    console.log(`Created ${myListItems.length} MyList items`);

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nTest User IDs:');
    users.forEach((user) => {
      console.log(`  ${user.username}: ${user._id}`);
    });
    console.log('\nTest Movie IDs:');
    movies.slice(0, 3).forEach((movie) => {
      console.log(`  ${movie.title}: ${movie._id}`);
    });
    console.log('\nTest TVShow IDs:');
    tvshows.slice(0, 2).forEach((show) => {
      console.log(`  ${show.title}: ${show._id}`);
    });
  } catch (error) {
    console.error('Database seeding error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

seedDatabase();
