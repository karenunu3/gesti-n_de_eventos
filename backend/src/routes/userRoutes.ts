import { Router } from 'express';
import { getUsers, createUser, deleteUser, updateUserRole, updateUserCareer } from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, restrictTo('ADMIN'), getUsers);
router.post('/', protect, restrictTo('ADMIN'), createUser);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUser);
router.put('/:id/role', protect, restrictTo('ADMIN'), updateUserRole);
router.put('/:id/career', protect, restrictTo('ADMIN'), updateUserCareer);

export default router;
