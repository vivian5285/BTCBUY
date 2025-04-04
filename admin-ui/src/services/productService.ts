import axios from 'axios';
import { Product, ProductListResponse, ProductFormData } from '../types/product';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const productService = {
  // 获取商品列表
  async getProducts(
    page: number = 1,
    pageSize: number = 10,
    keyword?: string
  ): Promise<ProductListResponse> {
    const response = await axios.get<ProductListResponse>(`${API_URL}/products`, {
      params: {
        page,
        pageSize,
        keyword
      }
    });
    return response.data;
  },

  // 获取单个商品
  async getProduct(id: string): Promise<Product> {
    const response = await axios.get<Product>(`${API_URL}/products/${id}`);
    return response.data;
  },

  // 创建商品
  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await axios.post<Product>(`${API_URL}/products`, data);
    return response.data;
  },

  // 更新商品
  async updateProduct(id: string, data: ProductFormData): Promise<Product> {
    const response = await axios.put<Product>(`${API_URL}/products/${id}`, data);
    return response.data;
  },

  // 删除商品
  async deleteProduct(id: string): Promise<void> {
    await axios.delete(`${API_URL}/products/${id}`);
  },

  // 更新商品状态
  async updateProductStatus(
    id: string,
    status: 'draft' | 'published' | 'sold_out'
  ): Promise<Product> {
    const response = await axios.patch<Product>(`${API_URL}/products/${id}/status`, {
      status
    });
    return response.data;
  }
}; 