import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.middleware';
import { ownerLimiter } from '../middleware/security.middleware';
import {
  getStaff,
  getStaffRoles,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
} from '../controllers/staff.controller';

const router = Router();

// All staff routes: must be authenticated + ADMIN role + rate-limited
router.use(authenticate, requireRole('ADMIN'), ownerLimiter);

// Staff CRUD – requires STAFF_MANAGE permission
router.get('/owner/staff', requirePermission('STAFF_MANAGE'), getStaff);
router.get('/owner/staff/roles', requirePermission('STAFF_MANAGE'), getStaffRoles);
router.post('/owner/staff', requirePermission('STAFF_MANAGE'), createStaff);
router.put('/owner/staff/:id', requirePermission('STAFF_MANAGE'), updateStaff);
router.delete('/owner/staff/:id', requirePermission('STAFF_MANAGE'), deleteStaff);
router.put('/owner/staff/:id/reset-password', requirePermission('STAFF_MANAGE'), resetStaffPassword);

export default router;
