import { Prisma } from '@prisma/client';

export type Product = Prisma.ProductGetPayload<{}>;
export type ProductWithStore = Prisma.ProductGetPayload<{
  include: { store: true }
}>;

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
  status?: 'draft' | 'published' | 'sold_out';
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  category?: string;
  status?: 'draft' | 'published' | 'sold_out';
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
} 