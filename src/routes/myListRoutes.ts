import { Router } from 'express';
import MyListController from '../controllers/myListController';

const router = Router();

// Add to list
router.post('/add', (req, res, next) => MyListController.addToMyList(req, res, next));

// Remove from list
router.delete('/remove/:contentId', (req, res, next) => MyListController.removeFromMyList(req, res, next));

// Get list items
router.get('/items', (req, res, next) => MyListController.getMyListItems(req, res, next));

// Get list statistics
router.get('/stats', (req, res, next) => MyListController.getListStats(req, res, next));

export default router;
