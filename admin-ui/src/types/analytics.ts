export interface SalesData {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  viewCount: number;
}

export interface UserBehavior {
  userId: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastActive: string;
  favoriteCategories: string[];
}

export interface AnalyticsResponse {
  salesData: SalesData[];
  productAnalytics: ProductAnalytics[];
  userBehavior: UserBehavior[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    activeUsers: number;
    topProducts: string[];
    topCategories: string[];
  };
} 