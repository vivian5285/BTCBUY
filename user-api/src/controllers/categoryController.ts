import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { CreateCategoryInput, UpdateCategoryInput } from '../types/category';

export const categoryController = {
  // 获取所有分类
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await CategoryService.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      res.status(500).json({ message: '获取分类列表失败' });
    }
  },

  // 获取单个分类
  async getCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: '分类不存在' });
      }
      res.json(category);
    } catch (error) {
      console.error('获取分类详情失败:', error);
      res.status(500).json({ message: '获取分类详情失败' });
    }
  },

  // 创建分类
  async createCategory(req: Request, res: Response) {
    try {
      const category = await CategoryService.createCategory(req.body as CreateCategoryInput);
      res.status(201).json(category);
    } catch (error) {
      console.error('创建分类失败:', error);
      res.status(500).json({ message: '创建分类失败' });
    }
  },

  // 更新分类
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body as UpdateCategoryInput);
      if (!category) {
        return res.status(404).json({ message: '分类不存在' });
      }
      res.json(category);
    } catch (error) {
      console.error('更新分类失败:', error);
      res.status(500).json({ message: '更新分类失败' });
    }
  },

  // 删除分类
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('删除分类失败:', error);
      res.status(500).json({ message: '删除分类失败' });
    }
  }
}; 