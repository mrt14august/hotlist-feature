import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: ReturnType<typeof createClient> | null = null;

export const connectRedis = async (): Promise<void> => {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          return new Error('Max retries exceeded');
        }
        return retries * 50;
      }
    },
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  await redisClient.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export default redisClient;
