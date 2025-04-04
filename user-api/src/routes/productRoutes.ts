import { Router } from 'express';
import { productController } from '../controllers/productController';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 公开路由
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);

// 需要认证的路由
router.use(requireAuth);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/status', productController.updateProductStatus);

// 图片上传路由
router.post('/upload', upload.single('file'), productController.uploadProductImageHandler);
router.delete('/image', productController.deleteProductImageHandler);

export default router; 