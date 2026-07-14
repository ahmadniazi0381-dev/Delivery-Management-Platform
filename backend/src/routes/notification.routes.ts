import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { userLimiter } from '../middleware/security.middleware';

const router = Router();

router.use(authenticate, userLimiter);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
