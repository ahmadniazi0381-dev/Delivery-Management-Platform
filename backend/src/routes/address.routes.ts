import { Router } from 'express';
import {
  getAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  checkEligibility,
} from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { userLimiter, validateBody } from '../middleware/security.middleware';
import { AddressSchema, UpdateAddressSchema } from '../middleware/validation.schemas';

const router = Router();

router.use(authenticate, userLimiter);

router.get('/',                                     getAddresses);
router.post('/',   validateBody(AddressSchema),     saveAddress);
router.put('/:id', validateBody(UpdateAddressSchema), updateAddress);
router.delete('/:id',                               deleteAddress);
router.patch('/:id/default',                        setDefaultAddress);
router.post('/check-eligibility',                   checkEligibility);

export default router;

