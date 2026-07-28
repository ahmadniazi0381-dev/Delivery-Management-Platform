import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.middleware';
import { ownerLimiter } from '../middleware/security.middleware';
import {
  getSalaryOverview,
  getStaffSalaryDetail,
  updateStaffSalary,
  getMonthlyPayroll,
} from '../controllers/salary.controller';

const router = Router();

// All salary routes require admin + STAFF_MANAGE permission
router.use(authenticate, requireRole('ADMIN'), ownerLimiter);

// Salary Management
router.get('/owner/salary',                              requirePermission('STAFF_MANAGE'), getSalaryOverview);
router.get('/owner/salary/month/:year/:month',           requirePermission('STAFF_MANAGE'), getMonthlyPayroll);
router.get('/owner/salary/:staffId',                     requirePermission('STAFF_MANAGE'), getStaffSalaryDetail);
router.put('/owner/salary/:staffId',                     requirePermission('STAFF_MANAGE'), updateStaffSalary);

export default router;
