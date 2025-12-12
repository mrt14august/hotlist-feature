import { MyListModel } from "../models/MyList";
import { MovieModel } from "../models/Movie";
import { TVShowModel } from "../models/TVShow";
import { getRedisClient } from "../db/redis";
import { MyListItem, Movie, TVShow } from "../types";

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300'); // 5 minutes default

// In-memory cache for list results (LRU style)
class ListCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 500; // Max items in memory cache

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number = 60): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (simple LRU approximation)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const listCache = new ListCache();

interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class MyListService {
  /**
   * Add item to user's list
   * Performance: O(1) for insert + cache invalidation
   */
  async addToMyList(
    userId: string,
    contentId: string,
    contentType: "movie" | "tvshow"
  ): Promise<MyListItem> {
    // Check if content exists
    const contentExists = await this.verifyContentExists(
      contentId,
      contentType
    );
    if (!contentExists) {
      throw new Error(`${contentType} with id ${contentId} not found`);
    }

    try {
      const myListItem = await MyListModel.create({
        userId,
        contentId,
        contentType,
        addedAt: new Date(),
      });

      await this.invalidateUserListCache(userId);

      return {
        userId: myListItem.userId,
        contentId: myListItem.contentId,
        contentType: myListItem.contentType as "movie" | "tvshow",
        addedAt: myListItem.addedAt,
      };
    } catch (error: any) {
      // Handle duplicate entry error
      if (error.code === 11000) {
        throw new Error("This item is already in your list");
      }
      throw error;
    }
  }

  /**
   * Remove item from user's list
   * Performance: O(1) delete + cache invalidation
   */
  async removeFromMyList(userId: string, contentId: string): Promise<boolean> {
    try {
      const result = await MyListModel.deleteOne({ userId, contentId });

      if (result.deletedCount === 0) {
        throw new Error("Item not found in your list");
      }

      // Invalidate cache for this user
      await this.invalidateUserListCache(userId);

      console.log(`Removed item ${contentId} from user ${userId}'s list`);
      return true;
    } catch (error: any) {
      console.error(`Failed to remove item from list:`, error);
      throw error;
    }
  }

  /**
   * Get user's list items with pagination and content details
   * Performance: <2ms local cache, <5ms Redis cache, <20ms first request (single DB query)
   */
  async getMyListItems(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResponse<MyListItem & { content?: Movie | TVShow }>> {
    const { page, pageSize } = options;
    const skip = (page - 1) * pageSize;

    // Updated cache key for v2
    const cacheKey = `mylist:v2:${userId}:${page}:${pageSize}`;

    // 1. Check LOCAL CACHE first
    const localCached = listCache.get(cacheKey);
    if (localCached) {
      console.log("Cache HIT (local):", userId);
      return localCached;
    }

    // 2. Check REDIS CACHE (keep existing logic)
    const redis = getRedisClient();
    try {
      const redisCached = await redis.get(cacheKey);
      if (redisCached) {
        const data = JSON.parse(redisCached);
        listCache.set(cacheKey, data, 30); // 30 seconds local cache
        console.log("Cache HIT (redis):", userId);
        return data;
      }
    } catch (cacheError) {
      console.error("Redis cache retrieval error:", cacheError);
    }
    //3. my fallback for DB..
    const pipeline: any[] = [
      { $match: { userId } },
      {
        $facet: {
          // Get paginated items with content enrichment
          items: [
            { $sort: { addedAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },

            // Lookup movie content
            {
              $lookup: {
                from: 'movies',
                let: { contentId: '$contentId', contentType: '$contentType' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$contentId'] },
                          { $eq: ['$$contentType', 'movie'] }
                        ]
                      }
                    }
                  },
                  {
                    $project: {
                      title: 1,
                      description: 1,
                      genres: 1,
                      releaseDate: 1,
                      director: 1,
                      actors: 1,
                      createdAt: 1,
                      updatedAt: 1
                    }
                  }
                ],
                as: 'movieContent'
              }
            },

            // Lookup TV show content
            {
              $lookup: {
                from: 'tvshows',
                let: { contentId: '$contentId', contentType: '$contentType' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$contentId'] },
                          { $eq: ['$$contentType', 'tvshow'] }
                        ]
                      }
                    }
                  },
                  {
                    $project: {
                      title: 1,
                      description: 1,
                      genres: 1,
                      episodes: 1,
                      createdAt: 1,
                      updatedAt: 1
                    }
                  }
                ],
                as: 'tvshowContent'
              }
            },

            // Merge content based on type
            {
              $addFields: {
                content: {
                  $cond: {
                    if: { $eq: ['$contentType', 'movie'] },
                    then: { $arrayElemAt: ['$movieContent', 0] },
                    else: { $arrayElemAt: ['$tvshowContent', 0] }
                  }
                }
              }
            },

            // Clean up temporary fields
            {
              $project: {
                movieContent: 0,
                tvshowContent: 0,
                _id: 0
              }
            }
          ],

          // Get total count in same query
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await MyListModel.aggregate(pipeline);

    const items = result[0].items;
    const total = result[0].totalCount[0]?.count || 0;

    const response: PaginatedResponse<MyListItem & { content?: Movie | TVShow }> = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    // Cache the result in both local and Redis!!
    try {
      listCache.set(cacheKey, response, 30);

      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));

      console.log("Cache SET:", userId);
    } catch (cacheError) {
      console.error("Cache storage error:", cacheError);
    }

    return response;
  }


  /**
   * Verify content exists in database
   */
  private async verifyContentExists(
    contentId: string,
    contentType: "movie" | "tvshow"
  ): Promise<boolean> {
    try {
      if (contentType === "movie") {
        const exists = await MovieModel.exists({ _id: contentId });
        return !!exists;
      } else {
        const exists = await TVShowModel.exists({ _id: contentId });
        return !!exists;
      }
    } catch (error) {
      console.error(
        `Content existence check failed for ${contentType} ${contentId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  private async invalidateUserListCache(userId: string): Promise<void> {
    const redis = getRedisClient();

    try {
      // Clear LOCAL CACHE first (immediate)
      listCache.clear(); // Clear all local cache for simplicity

      // Clear REDIS CACHE (keeping existing logic)
      const pattern = `mylist:*:${userId}:*`;
      let cursor = 0;
      const keysToDelete: string[] = [];

      do {
        const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        keysToDelete.push(...result.keys);
      } while (cursor !== 0);

      if (keysToDelete.length > 0) {
        // Delete in batches to avoid Redis command size limits
        const batchSize = 100;
        for (let i = 0; i < keysToDelete.length; i += batchSize) {
          const batch = keysToDelete.slice(i, i + batchSize);
          await redis.del(batch);
        }
        console.log(`Invalidated ${keysToDelete.length} cache entries for user ${userId}`);
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all user list items (administrative function)
   */
  async clearUserList(userId: string): Promise<number> {
    const result = await MyListModel.deleteMany({ userId });
    await this.invalidateUserListCache(userId);
    return result.deletedCount;
  }

  /**
   * Get user list statistics
   */
  async getListStats(
    userId: string
  ): Promise<{ total: number; byType: { movie: number; tvshow: number } }> {
    const total = await MyListModel.countDocuments({ userId });
    const byType = await MyListModel.aggregate([
      { $match: { userId } },
      { $group: { _id: "$contentType", count: { $sum: 1 } } },
    ]);

    const stats = {
      total,
      byType: {
        movie: 0,
        tvshow: 0,
      },
    };

    byType.forEach((item: any) => {
      if (item._id === "movie") {
        stats.byType.movie = item.count;
      } else if (item._id === "tvshow") {
        stats.byType.tvshow = item.count;
      }
    });

    return stats;
  }
}

export default new MyListService();
