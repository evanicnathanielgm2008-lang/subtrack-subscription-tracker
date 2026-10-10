import { BillingCycle, Subscription, SubscriptionCategory } from '../types';
import { CURRENCIES } from './constants';

/**
 * Calculates monthly equivalent for a given amount and billing cycle.
 * Rules:
 * - Weekly: amount * 52 / 12
 * - Monthly: amount
 * - Quarterly: (amount * 4) / 12 = amount / 3
 * - Yearly: amount / 12
 */
export function calculateMonthlyEquivalent(amount: number, cycle: BillingCycle): number {
  if (isNaN(amount) || amount <= 0) return 0;
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return (amount * 4) / 12;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Calculates yearly estimate for a given amount and billing cycle.
 * Rules:
 * - Weekly: amount * 52
 * - Monthly: amount * 12
 * - Quarterly: amount * 4
 * - Yearly: amount
 */
export function calculateYearlyEstimate(amount: number, cycle: BillingCycle): number {
  if (isNaN(amount) || amount <= 0) return 0;
  switch (cycle) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'yearly':
      return amount;
    default:
      return amount * 12;
  }
}

/**
 * Advances renewal date based on billing cycle.
 */
export function advanceRenewalDate(currentDateStr: string, cycle: BillingCycle): string {
  const date = new Date(currentDateStr);
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    date.setTime(fallback.getTime());
  }

  const next = new Date(date);
  switch (cycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly': {
      const targetMonth = next.getMonth() + 1;
      next.setMonth(targetMonth);
      break;
    }
    case 'quarterly': {
      const targetMonth = next.getMonth() + 3;
      next.setMonth(targetMonth);
      break;
    }
    case 'yearly': {
      next.setFullYear(next.getFullYear() + 1);
      break;
    }
  }

  return next.toISOString().split('T')[0];
}

export type RenewalUrgency =
  | 'Overdue'
  | 'Due today'
  | 'Due within 3 days'
  | 'Due within 7 days'
  | 'Due later';

/**
 * Calculates day difference from today to renewal date.
 * Returns negative if in the past, 0 if today, positive if future.
 */
export function getDaysUntilRenewal(renewalDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(renewalDateStr);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Classifies a subscription into urgency category.
 */
export function getRenewalUrgency(renewalDateStr: string, status: string): RenewalUrgency {
  if (status === 'Cancelled') {
    return 'Due later';
  }

  const days = getDaysUntilRenewal(renewalDateStr);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days <= 3) return 'Due within 3 days';
  if (days <= 7) return 'Due within 7 days';
  return 'Due later';
}

/**
 * Formats currency amount based on code and user settings.
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR', decimals: number = 0): string {
  const config = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const rounded = Number(amount.toFixed(decimals));

  try {
    return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(rounded);
  } catch {
    return `${config.symbol}${rounded.toLocaleString()}`;
  }
}

/**
 * Duplicate subscription detector:
 * Checks service name (case-insensitive), billing cycle, and renewal date.
 */
export function checkDuplicateSubscription(
  subscriptions: Subscription[],
  candidate: { name: string; billingCycle: BillingCycle; nextRenewalDate: string },
  excludeId?: string
): Subscription | null {
  const cleanName = candidate.name.trim().toLowerCase();
  if (!cleanName) return null;

  const found = subscriptions.find((sub) => {
    if (excludeId && sub.id === excludeId) return false;
    if (sub.status === 'Cancelled') return false;
    const sameName = sub.name.trim().toLowerCase() === cleanName;
    const sameCycle = sub.billingCycle === candidate.billingCycle;
    const sameDate = sub.nextRenewalDate === candidate.nextRenewalDate;
    return sameName && sameCycle && sameDate;
  });

  return found || null;
}

/**
 * Summary metrics for dashboard
 */
export interface SpendingMetrics {
  activeCount: number;
  cancelledCount: number;
  monthlySpending: number;
  yearlySpending: number;
  upcomingRenewals7DaysCount: number;
  upcomingRenewals7DaysTotal: number;
  overdueCount: number;
  potentialYearlySavings: number;
  categorySpending: Record<SubscriptionCategory, number>;
}

export function calculateSpendingMetrics(subscriptions: Subscription[]): SpendingMetrics {
  let activeCount = 0;
  let cancelledCount = 0;
  let monthlySpending = 0;
  let yearlySpending = 0;
  let upcomingRenewals7DaysCount = 0;
  let upcomingRenewals7DaysTotal = 0;
  let overdueCount = 0;
  let potentialYearlySavings = 0;

  const categorySpending: Record<SubscriptionCategory, number> = {
    Entertainment: 0,
    Music: 0,
    Software: 0,
    Education: 0,
    Productivity: 0,
    Utilities: 0,
    'Health & Fitness': 0,
    Gaming: 0,
    Other: 0,
  };

  for (const sub of subscriptions) {
    if (sub.status === 'Cancelled') {
      cancelledCount++;
      potentialYearlySavings += calculateYearlyEstimate(sub.amount, sub.billingCycle);
      continue;
    }

    // Active, Renewed, or Skipped
    activeCount++;
    const monthlyEq = calculateMonthlyEquivalent(sub.amount, sub.billingCycle);
    const yearlyEst = calculateYearlyEstimate(sub.amount, sub.billingCycle);

    monthlySpending += monthlyEq;
    yearlySpending += yearlyEst;

    if (categorySpending[sub.category] !== undefined) {
      categorySpending[sub.category] += monthlyEq;
    } else {
      categorySpending.Other = (categorySpending.Other || 0) + monthlyEq;
    }

    const days = getDaysUntilRenewal(sub.nextRenewalDate);
    if (days < 0) {
      overdueCount++;
    } else if (days <= 7) {
      upcomingRenewals7DaysCount++;
      upcomingRenewals7DaysTotal += sub.amount;
    }
  }

  return {
    activeCount,
    cancelledCount,
    monthlySpending,
    yearlySpending,
    upcomingRenewals7DaysCount,
    upcomingRenewals7DaysTotal,
    overdueCount,
    potentialYearlySavings,
    categorySpending,
  };
}

/**
 * Format relative countdown string like "Due in 3 days", "Due today", "Overdue by 2 days"
 */
export function formatCountdown(days: number): string {
  if (days < -1) return `Overdue by ${Math.abs(days)} days`;
  if (days === -1) return 'Overdue by 1 day';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
