import { Router } from 'express';
import {
  submitReview,
  getMyReviews,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { userLimiter, reviewLimiter, validateBody } from '../middleware/security.middleware';
import { ReviewSchema } from '../middleware/validation.schemas';

const router = Router();

router.use(authenticate, userLimiter);

router.post('/', reviewLimiter, validateBody(ReviewSchema), submitReview);
router.get('/', getMyReviews);

export default router;
