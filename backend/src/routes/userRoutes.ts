import { Router } from 'express';
import { getUsers, createUser, deleteUser, updateUserRole } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, restrictTo('ADMIN'), getUsers);
router.post('/', protect, restrictTo('ADMIN'), createUser);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUser);
router.put('/:id/role', protect, restrictTo('ADMIN'), updateUserRole);

export default router;
