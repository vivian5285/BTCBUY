import { PrismaClient } from '@prisma/client';
import { CreateCategoryInput, UpdateCategoryInput, CategoryTree } from '../types/category';

const prisma = new PrismaClient();

export class CategoryService {
  // 获取所有分类
  static async getCategories(): Promise<CategoryTree[]> {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return this.buildCategoryTree(categories);
  }

  // 获取单个分类
  static async getCategory(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  // 创建分类
  static async createCategory(data: CreateCategoryInput) {
    return prisma.category.create({
      data
    });
  }

  // 更新分类
  static async updateCategory(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  // 删除分类
  static async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id }
    });
  }

  // 构建分类树
  private static buildCategoryTree(categories: any[]): CategoryTree[] {
    const categoryMap = new Map();
    const roots: CategoryTree[] = [];

    // 创建节点映射
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建树结构
    categories.forEach(category => {
      const node = categoryMap.get(category.id);
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
} 