import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ProductService } from '../services/productService';
import { CreateProductInput, UpdateProductInput } from '../types/product';
import { uploadProductImage, deleteProductImage } from '../services/ossService';
import multer from 'multer';

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// 创建商品
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const product = await ProductService.createProduct(userId, req.body as CreateProductInput);
    res.status(201).json(product);
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : '创建商品失败' });
  }
};

// 更新商品
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;
    const product = await ProductService.updateProduct(id, userId, req.body as UpdateProductInput);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : '更新商品失败' });
  }
};

// 获取店铺商品列表
export const getStoreProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const products = await ProductService.getStoreProducts(userId);
    res.json(products);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : '获取商品列表失败' });
  }
};

// 获取商品详情
export const getProductDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductService.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ message: '获取商品详情失败' });
  }
};

// 更新商品状态
export const updateProductStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const product = await ProductService.updateProductStatus(
      id,
      userId,
      status as 'draft' | 'published' | 'sold_out'
    );
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('更新商品状态失败:', error);
    res.status(500).json({ message: '更新商品状态失败' });
  }
};

// 获取所有已发布商品
export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await ProductService.getAllPublishedProducts();
    res.json(products);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : '获取商品列表失败' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    await ProductService.deleteProduct(productId, userId);
    res.status(204).send();
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ message: '删除商品失败' });
  }
};

export const productController = {
  // 获取商品列表
  async getProducts(req: Request, res: Response) {
    try {
      const { page = 1, pageSize = 10, keyword } = req.query;
      const products = await ProductService.getProducts(
        Number(page),
        Number(pageSize),
        keyword as string
      );
      res.json(products);
    } catch (error) {
      console.error('获取商品列表失败:', error);
      res.status(500).json({ message: '获取商品列表失败' });
    }
  },

  // 获取单个商品
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: '商品不存在' });
      }
      res.json(product);
    } catch (error) {
      console.error('获取商品详情失败:', error);
      res.status(500).json({ message: '获取商品详情失败' });
    }
  },

  // 创建商品
  async createProduct(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '未授权' });
      }
      const product = await ProductService.createProduct(req.user.id, req.body as CreateProductInput);
      res.status(201).json(product);
    } catch (error) {
      console.error('创建商品失败:', error);
      res.status(500).json({ message: '创建商品失败' });
    }
  },

  // 更新商品
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ message: '未授权' });
      }
      const product = await ProductService.updateProduct(id, req.user.id, req.body as UpdateProductInput);
      if (!product) {
        return res.status(404).json({ message: '商品不存在' });
      }
      res.json(product);
    } catch (error) {
      console.error('更新商品失败:', error);
      res.status(500).json({ message: '更新商品失败' });
    }
  },

  // 删除商品
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ message: '未授权' });
      }
      await ProductService.deleteProduct(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('删除商品失败:', error);
      res.status(500).json({ message: '删除商品失败' });
    }
  },

  // 更新商品状态
  async updateProductStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!req.user) {
        return res.status(401).json({ message: '未授权' });
      }
      const product = await ProductService.updateProductStatus(
        id,
        req.user.id,
        status as 'draft' | 'published' | 'sold_out'
      );
      if (!product) {
        return res.status(404).json({ message: '商品不存在' });
      }
      res.json(product);
    } catch (error) {
      console.error('更新商品状态失败:', error);
      res.status(500).json({ message: '更新商品状态失败' });
    }
  }
};

// 上传商品图片
export const uploadProductImageHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未提供图片文件' });
    }

    const imageUrl = await uploadProductImage(req.file);
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('上传商品图片失败:', error);
    res.status(500).json({ message: '上传商品图片失败' });
  }
};

// 删除商品图片
export const deleteProductImageHandler = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: '未提供图片 URL' });
    }

    await deleteProductImage(url);
    res.status(204).send();
  } catch (error) {
    console.error('删除商品图片失败:', error);
    res.status(500).json({ message: '删除商品图片失败' });
  }
}; 