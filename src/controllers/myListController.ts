import { Request, Response, NextFunction } from 'express';
import MyListService from '../services/myListService';

export class MyListController {
  /**
   * POST /api/mylist/add
   * Add item to user's list
   */
  async addToMyList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contentId, contentType } = req.body;
      const userId = req.headers['user-id'] as string;

      if (!userId) {
        res.status(400).json({ error: 'user-id header is required' });
        return;
      }

      if (!contentId || !contentType) {
        res.status(400).json({ error: 'contentId and contentType are required' });
        return;
      }

      if (!['movie', 'tvshow'].includes(contentType)) {
        res.status(400).json({ error: 'contentType must be "movie" or "tvshow"' });
        return;
      }

      const result = await MyListService.addToMyList(userId, contentId, contentType);
      res.status(201).json({
        success: true,
        message: 'Item added to your list',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/mylist/remove/:contentId
   * Remove item from user's list
   */
  async removeFromMyList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contentId } = req.params;
      const userId = req.headers['user-id'] as string;

      if (!userId) {
        res.status(400).json({ error: 'user-id header is required' });
        return;
      }

      if (!contentId) {
        res.status(400).json({ error: 'contentId is required' });
        return;
      }

      await MyListService.removeFromMyList(userId, contentId);
      res.status(200).json({
        success: true,
        message: 'Item removed from your list'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mylist/items
   * Get user's list items with pagination
   * Query params: page (default: 1), pageSize (default: 20)
   */
  async getMyListItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;
      let page = parseInt(req.query.page as string) || 1;
      let pageSize = parseInt(req.query.pageSize as string) || 20;

      if (!userId) {
        res.status(400).json({ error: 'user-id header is required' });
        return;
      }

      // Validate pagination params
      const maxPageSize = parseInt(process.env.MAX_PAGE_SIZE || '100');
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 1;
      if (pageSize > maxPageSize) pageSize = maxPageSize;

      const result = await MyListService.getMyListItems(userId, { page, pageSize });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mylist/stats
   * Get user's list statistics
   */
  async getListStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers['user-id'] as string;

      if (!userId) {
        res.status(400).json({ error: 'user-id header is required' });
        return;
      }

      const stats = await MyListService.getListStats(userId);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MyListController();
