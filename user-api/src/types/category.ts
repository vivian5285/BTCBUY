import { Prisma } from '@prisma/client';

export type Category = Prisma.CategoryGetPayload<{}>;

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  image?: string;
  sortOrder?: number;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
} 