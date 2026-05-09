import { Router } from 'express';
import {
  getUsers, createUser, deleteUser, updateUserRole, updateUserCareer,
  getMyProfile, updateMyProfile, changeMyPassword,
} from '../controllers/userController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Mi Perfil — cualquier usuario autenticado
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.put('/me/password', protect, changeMyPassword);

// Admin
router.get('/', protect, restrictTo('ADMIN'), getUsers);
router.post('/', protect, restrictTo('ADMIN'), createUser);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUser);
router.put('/:id/role', protect, restrictTo('ADMIN'), updateUserRole);
router.put('/:id/career', protect, restrictTo('ADMIN'), updateUserCareer);

export default router;
