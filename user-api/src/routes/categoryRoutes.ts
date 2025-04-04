import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 公开路由
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// 需要认证的路由
router.use(requireAuth);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router; 