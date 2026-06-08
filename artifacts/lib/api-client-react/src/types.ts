export type Plan = {
  id: number;
  name: string;
  category: string;
  speed: string;
  priceMonthly: number;
  hardwarePrice?: number;
  description: string;
  features: string[];
  paystackPlanCode?: string | null;
  paystackPaymentLink?: string | null;
  popular: boolean;
  active: boolean;
  createdAt: string;
};

export type Subscription = {
  id: number;
  email: string;
  name: string;
  planId: number;
  planName: string;
  planCategory: string;
  planSpeed: string;
  priceMonthly: number;
  features: string[];
  paystackReference?: string | null;
  status: string;
  address?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
};

export type AdminStats = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  newThisMonth: number;
  planBreakdown: { planName: string; count: number; revenue: number }[];
  recentSubscriptions: Subscription[];
};

export type RevenueStats = {
  monthly: { month: string; revenue: number; subscriptions: number }[];
};

export type AdminLoginResponse = {
  success: boolean;
  token: string;
};

export type ListSubscriptionsResponse = {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
};

export type ListSubscriptionsStatus = "all" | "active" | "cancelled" | "past_due";
