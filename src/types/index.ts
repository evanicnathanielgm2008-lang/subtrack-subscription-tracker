export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Skipped' | 'Renewed';

export type SubscriptionCategory =
  | 'Entertainment'
  | 'Music'
  | 'Software'
  | 'Education'
  | 'Utilities'
  | 'Health & Fitness'
  | 'Productivity'
  | 'Gaming'
  | 'Other';

export type UsageFrequency = 'daily' | 'weekly' | 'rarely' | 'never';

export interface Subscription {
  id: string;
  name: string;
  serviceKey?: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  paymentMethod?: string;
  notes?: string;
  status: SubscriptionStatus;
  reminderDaysBefore: number; // 1, 3, or 7
  usageFrequency?: UsageFrequency;
  brandColor?: string;
  iconName?: string;
  websiteUrl?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HistoryAction = 'Renewed' | 'Cancelled' | 'Skipped';

export interface RenewalHistoryItem {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  category: SubscriptionCategory;
  previousRenewalDate: string;
  newRenewalDate?: string;
  amount: number;
  currency: string;
  action: HistoryAction;
  dateOfAction: string; // ISO timestamp
  notes?: string;
}

export interface UserSettings {
  currency: string;
  defaultReminderDays: number;
  browserNotificationsEnabled: boolean;
  notifyOnDueToday: boolean;
  emailDigestEnabled: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateToINR: number; // For multi-currency display estimation
}

export type PageId =
  | 'dashboard'
  | 'subscriptions'
  | 'renewals'
  | 'insights'
  | 'history'
  | 'settings';
