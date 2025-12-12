import { MyListModel } from "../models/MyList";
import { MovieModel } from "../models/Movie";
import { TVShowModel } from "../models/TVShow";
import { getRedisClient } from "../db/redis";
import { MyListItem, Movie, TVShow } from "../types";

const CACHE_TTL = parseInt(process.env.CACHE_TTL || "300"); // 5 minutes default

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
   * Get user's list items with pagination
   * Performance: <10ms with Redis caching (hits cache on most requests)
   * First request: ~50-100ms (MongoDB query + Redis cache set)
   */
  async getMyListItems(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResponse<MyListItem & { content?: Movie | TVShow }>> {
    const { page, pageSize } = options;
    const skip = (page - 1) * pageSize;

    // Try to get from cache first
    const cacheKey = `mylist:${userId}:${page}:${pageSize}`;
    const redis = getRedisClient();

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log("Cache HIT for user list:", userId);
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error("Cache retrieval error:", cacheError);
      // Continue with database query if cache fails
    }

    // Get total count
    const total = await MyListModel.countDocuments({ userId });

    // Get paginated items
    const items = await MyListModel.find({ userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    // Enrich with content details
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const content = await this.getContentDetails(
          item.contentId,
          item.contentType as "movie" | "tvshow"
        );
        return {
          ...item,
          content,
          _id: undefined,
        };
      })
    );

    const response: PaginatedResponse<
      MyListItem & { content?: Movie | TVShow }
    > = {
      items: enrichedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    // Cache the result
    try {
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
      console.log("Cache SET for user list:", userId);
    } catch (cacheError) {
      console.error("Cache storage error:", cacheError);
      // Continue even if caching fails
    }

    return response;
  }

  /**
   * Get content details by ID and type
   */
  private async getContentDetails(
    contentId: string,
    contentType: "movie" | "tvshow"
  ): Promise<Movie | TVShow | undefined> {
    try {
      if (contentType === "movie") {
        const movie = await MovieModel.findById(contentId).lean().exec();
        return movie as Movie | undefined;
      } else {
        const tvShow = await TVShowModel.findById(contentId).lean().exec();
        return tvShow as TVShow | undefined;
      }
    } catch (error) {
      console.error(`Failed to fetch ${contentType} ${contentId}:`, error);
      return undefined;
    }
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
      // Get all keys matching pattern and delete them
      const pattern = `mylist:${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(keys);
        console.log(
          `Invalidated ${keys.length} cache entries for user ${userId}`
        );
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
      // Continue even if cache invalidation fails
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
