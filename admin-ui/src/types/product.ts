export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'published' | 'sold_out';

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
  status: ProductStatus;
} 