export interface PageViewData {
  dimensions: { pagePath: string }[];
  metrics: { screenPageViews: number }[];
}

export interface BasicMetrics {
  screenPageViews: number;
  totalUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
}

export interface AnalyticsError {
  message: string;
  code?: string;
}

export interface Account {
  id: string;
  name: string;
  fullName: string;
}

export interface Property {
  id: string;
  name: string;
  fullName: string;
  createTime?: string;
  updateTime?: string;
}

export interface AnalyticsData {
  // Add your analytics data types here
}
