import { PrismaClient, Prisma } from '@prisma/client';
import { CreateProductInput, UpdateProductInput, Product, ProductWithStore } from '../types/product';

const prisma = new PrismaClient();

export class ProductService {
  // 获取商品列表
  static async getProducts(page: number, pageSize: number, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.ProductWhereInput = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      total,
      page,
      pageSize
    };
  }

  // 获取单个商品
  static async getProduct(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id }
    });
  }

  // 创建商品
  static async createProduct(userId: string, data: CreateProductInput): Promise<Product> {
    const store = await prisma.store.findFirst({
      where: { ownerId: userId }
    });

    if (!store) {
      throw new Error('店铺不存在');
    }

    return prisma.product.create({
      data: {
        ...data,
        storeId: store.id
      }
    });
  }

  // 更新商品
  static async updateProduct(id: string, userId: string, data: UpdateProductInput): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    if (product.store.ownerId !== userId) {
      throw new Error('无权修改此商品');
    }

    return prisma.product.update({
      where: { id },
      data
    });
  }

  // 删除商品
  static async deleteProduct(id: string, userId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    if (product.store.ownerId !== userId) {
      throw new Error('无权删除此商品');
    }

    await prisma.product.delete({
      where: { id }
    });
  }

  // 更新商品状态
  static async updateProductStatus(
    id: string,
    userId: string,
    status: 'draft' | 'published' | 'sold_out'
  ): Promise<Product> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    if (product.store.ownerId !== userId) {
      throw new Error('无权修改此商品状态');
    }

    return prisma.product.update({
      where: { id },
      data: { status }
    });
  }

  // 获取店铺商品列表
  static async getStoreProducts(storeId: string): Promise<ProductWithStore[]> {
    return prisma.product.findMany({
      where: { storeId },
      include: { store: true }
    });
  }

  // 获取商品详情
  static async getProductDetail(productId: string): Promise<ProductWithStore> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    return product;
  }

  // 获取所有已发布商品
  static async getAllPublishedProducts(): Promise<ProductWithStore[]> {
    return prisma.product.findMany({
      where: { status: 'published' },
      include: { store: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 获取所有已发布商品
  static async getPublishedProducts(): Promise<ProductWithStore[]> {
    return prisma.product.findMany({
      where: { status: 'published' },
      include: { store: true }
    });
  }
} 