import React from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { Subscription } from '../types';
import {
  formatCurrency,
  calculateMonthlyEquivalent,
  calculateYearlyEstimate,
} from '../utils/calculations';
import { ServiceIcon } from '../components/ServiceIcon';
import {
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface SpendingInsightsPageProps {
  onCancelClick: (sub: Subscription) => void;
}

export const SpendingInsightsPage: React.FC<SpendingInsightsPageProps> = ({
  onCancelClick,
}) => {
  const { subscriptions, settings, metrics } = useSubscriptions();

  const activeSubs = subscriptions.filter((s) => s.status !== 'Cancelled');
  const cancelledSubs = subscriptions.filter((s) => s.status === 'Cancelled');

  // 1. Most expensive subscription (by monthly equivalent)
  const mostExpensive = [...activeSubs].sort((a, b) => {
    return (
      calculateMonthlyEquivalent(b.amount, b.billingCycle) -
      calculateMonthlyEquivalent(a.amount, a.billingCycle)
    );
  })[0];

  // 2. Highest spending category
  const sortedCategories = Object.entries(metrics.categorySpending)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const topCategoryPercentage =
    topCategory && metrics.monthlySpending > 0
      ? Math.round((topCategory[1] / metrics.monthlySpending) * 100)
      : 0;

  // 3. Billing cycle breakdown
  const cycleBreakdown: Record<string, { count: number; totalMonthly: number }> = {
    weekly: { count: 0, totalMonthly: 0 },
    monthly: { count: 0, totalMonthly: 0 },
    quarterly: { count: 0, totalMonthly: 0 },
    yearly: { count: 0, totalMonthly: 0 },
  };

  activeSubs.forEach((sub) => {
    const m = calculateMonthlyEquivalent(sub.amount, sub.billingCycle);
    if (cycleBreakdown[sub.billingCycle]) {
      cycleBreakdown[sub.billingCycle].count++;
      cycleBreakdown[sub.billingCycle].totalMonthly += m;
    }
  });

  const cycleChartData = Object.entries(cycleBreakdown)
    .filter(([_, data]) => data.count > 0)
    .map(([cycle, data]) => ({
      cycle: cycle.charAt(0).toUpperCase() + cycle.slice(1),
      amount: Math.round(data.totalMonthly),
      count: data.count,
    }));

  // 4. Top 5 Costliest Subscriptions Chart
  const top5Subscriptions = [...activeSubs]
    .sort((a, b) => {
      return (
        calculateMonthlyEquivalent(b.amount, b.billingCycle) -
        calculateMonthlyEquivalent(a.amount, a.billingCycle)
      );
    })
    .slice(0, 5)
    .map((sub) => ({
      name: sub.name.length > 14 ? sub.name.substring(0, 14) + '...' : sub.name,
      monthlyCost: Math.round(calculateMonthlyEquivalent(sub.amount, sub.billingCycle)),
      color: sub.brandColor || '#8B5CF6',
    }));

  // 5. Audit Recommendations / Rarely Used Subscriptions (Stretch Feature)
  const auditCandidates = activeSubs.filter(
    (sub) => sub.usageFrequency === 'rarely' || sub.usageFrequency === 'never'
  );

  return (
    <div className="space-y-6">
      {/* Top 4 Insight Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Most Expensive Subscription */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Most Expensive Service
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          {mostExpensive ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ServiceIcon
                  name={mostExpensive.name}
                  iconName={mostExpensive.iconName}
                  brandColor={mostExpensive.brandColor}
                  size="sm"
                />
                <span className="text-sm font-bold text-white truncate">
                  {mostExpensive.name}
                </span>
              </div>
              <p className="text-xl font-extrabold text-purple-300">
                {formatCurrency(
                  calculateMonthlyEquivalent(mostExpensive.amount, mostExpensive.billingCycle),
                  settings.currency
                )}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatCurrency(mostExpensive.amount, mostExpensive.currency)} per {mostExpensive.billingCycle}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active subscriptions</p>
          )}
        </div>

        {/* Card 2: Highest Spending Category */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Category
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          {topCategory ? (
            <div>
              <h4 className="text-sm font-bold text-white mb-1">{topCategory[0]}</h4>
              <p className="text-xl font-extrabold text-blue-300">
                {formatCurrency(topCategory[1], settings.currency)}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Accounts for <strong className="text-blue-400">{topCategoryPercentage}%</strong> of monthly outlay
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No categories active</p>
          )}
        </div>

        {/* Card 3: Potential Yearly Savings from Cancelled */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Yearly Savings Achieved
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-300 mb-1">
              {cancelledSubs.length} Cancelled Sub{cancelledSubs.length === 1 ? '' : 's'}
            </h4>
            <p className="text-xl font-extrabold text-emerald-300">
              {formatCurrency(metrics.potentialYearlySavings, settings.currency)}
              <span className="text-xs font-normal text-slate-400">/yr</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Prevented recurring spending
            </p>
          </div>
        </div>

        {/* Card 4: 7-Day Renewal Cash Burden */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Next 7 Days Due
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-300 mb-1">
              {metrics.upcomingRenewals7DaysCount} Approaching
            </h4>
            <p className="text-xl font-extrabold text-amber-300">
              {formatCurrency(metrics.upcomingRenewals7DaysTotal, settings.currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensure sufficient balance
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section: Top 5 Costliest + Cycle Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top 5 Costliest Subscriptions Bar Chart */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Top Costliest Subscriptions (Monthly Equivalent)
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by normalized monthly financial burden
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top5Subscriptions}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#CBD5E1"
                  fontSize={11}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs">
                          <p className="font-semibold text-white">{data.name}</p>
                          <p className="text-purple-400 font-bold mt-1">
                            {formatCurrency(data.monthlyCost, settings.currency)}/month eq.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="monthlyCost" radius={[0, 6, 6, 0]}>
                  {top5Subscriptions.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color || '#8B5CF6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Billing Cycle Composition */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Spend by Billing Frequency
            </h3>
            <p className="text-xs text-slate-400">
              Monthly vs Annual vs Quarterly distribution
            </p>
          </div>

          <div className="space-y-4">
            {cycleChartData.map((cycle) => {
              const pct =
                metrics.monthlySpending > 0
                  ? Math.round((cycle.amount / metrics.monthlySpending) * 100)
                  : 0;

              return (
                <div key={cycle.cycle} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {cycle.cycle} ({cycle.count} {cycle.count === 1 ? 'service' : 'services'})
                    </span>
                    <span className="font-bold text-purple-300">
                      {formatCurrency(cycle.amount, settings.currency)}/mo ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Review / Audit Candidates (Stretch Feature #10) */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-purple-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> SubTrack Optimizer & Review Recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Personalized audit suggestions based on user-provided usage frequency
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {auditCandidates.length} Candidates to Audit
          </span>
        </div>

        {auditCandidates.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-200 font-semibold">All active subscriptions are regularly utilized!</p>
            <p className="mt-1">No services marked as "rarely" or "never" used at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {auditCandidates.map((sub) => {
              const yearlyEst = calculateYearlyEstimate(sub.amount, sub.billingCycle);
              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceIcon
                      name={sub.name}
                      iconName={sub.iconName}
                      brandColor={sub.brandColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{sub.name}</h4>
                      <p className="text-[11px] text-amber-400 font-medium">
                        Marked as "{sub.usageFrequency}" used
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Cancelling would save ~{formatCurrency(yearlyEst, sub.currency)}/year
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onCancelClick(sub)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition"
                  >
                    Cancel & Save
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Transparency Notice:</strong> Usage insights are strictly based on self-reported frequency from the subscription edit form. SubTrack does not inspect third-party logins or telemetry.
          </span>
        </div>
      </div>
    </div>
  );
};
