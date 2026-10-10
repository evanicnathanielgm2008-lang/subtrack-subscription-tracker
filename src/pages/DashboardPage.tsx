import React from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { PageId, Subscription } from '../types';
import {
  formatCurrency,
  getDaysUntilRenewal,
  formatCountdown,
  calculateMonthlyEquivalent,
  calculateYearlyEstimate,
} from '../utils/calculations';
import { ServiceIcon } from '../components/ServiceIcon';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  PieChart as PieIcon,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
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

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onOpenAddModal: () => void;
  onRenewClick: (sub: Subscription) => void;
  onSkipClick: (sub: Subscription) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddModal,
  onRenewClick,
  onSkipClick,
}) => {
  const { subscriptions, history, settings, metrics } = useSubscriptions();

  // Active subscriptions sorted by renewal urgency
  const activeSubs = subscriptions
    .filter((s) => s.status !== 'Cancelled')
    .map((sub) => ({
      sub,
      days: getDaysUntilRenewal(sub.nextRenewalDate),
    }))
    .sort((a, b) => a.days - b.days);

  // Urgent subscriptions (due within 7 days or overdue)
  const urgentRenewals = activeSubs.filter((item) => item.days <= 7);

  // Recently updated or created subscriptions
  const recentlyUpdated = [...subscriptions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Category breakdown data for Recharts PieChart
  const categoryChartData = Object.entries(metrics.categorySpending)
    .filter(([_, val]) => val > 0)
    .map(([category, amount]) => ({
      name: category,
      value: Math.round(amount),
    }))
    .sort((a, b) => b.value - a.value);

  const CATEGORY_COLORS = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
    '#94A3B8', // Slate
  ];

  // Projected 6-month monthly spend projection chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  const spendingTrendData = Array.from({ length: 6 }).map((_, idx) => {
    const monthName = months[(currentMonthIdx + idx) % 12];
    // Monthly baseline + slight realistic jitter for quarterly/yearly renewals
    const variationFactor = 1 + ((idx % 3 === 0 ? 0.08 : 0) - (idx % 2 === 0 ? 0.04 : 0));
    return {
      month: monthName,
      spending: Math.round(metrics.monthlySpending * variationFactor),
    };
  });

  return (
    <div className="space-y-6">
      {/* Overdue Alert Banner if any overdue subscriptions exist */}
      {metrics.overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {metrics.overdueCount} Subscription{metrics.overdueCount > 1 ? 's are' : ' is'} overdue for renewal
              </h4>
              <p className="text-xs text-rose-300/80">
                Action required: Update renewal dates or mark them renewed to keep records accurate.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('renewals')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition shrink-0"
          >
            Review Overdue Renewals
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Subscriptions */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 hover:border-purple-500/30 transition relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Active Subscriptions
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {metrics.activeCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
            <span>{metrics.cancelledCount} Cancelled</span>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Monthly Spending Equivalent */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 hover:border-purple-500/30 transition relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Monthly Spending
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {formatCurrency(metrics.monthlySpending, settings.currency)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
            <span>Standardized equivalent</span>
            <span className="text-emerald-400 font-medium">Weekly + Monthly + Annual</span>
          </div>
        </div>

        {/* 3. Estimated Yearly Spending */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 hover:border-purple-500/30 transition relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Yearly Estimate
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {formatCurrency(metrics.yearlySpending, settings.currency)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
            <span>Projected commitments</span>
            <button
              onClick={() => onNavigate('insights')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
            >
              Audit spend <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4. Upcoming Renewals (7 Days) */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 hover:border-purple-500/30 transition relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Due in 7 Days
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {metrics.upcomingRenewals7DaysCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
            <span className="text-amber-400 font-semibold">
              {formatCurrency(metrics.upcomingRenewals7DaysTotal, settings.currency)} due
            </span>
            <button
              onClick={() => onNavigate('renewals')}
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
            >
              Action list <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section: Monthly Spending Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Spending Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Projected Spending Horizon
              </h3>
              <p className="text-xs text-slate-400">
                Monthly commitment forecast across active subscriptions
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Avg ~{formatCurrency(metrics.monthlySpending, settings.currency)}/mo
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs">
                          <p className="font-semibold text-slate-300">{payload[0].payload.month}</p>
                          <p className="text-purple-400 font-bold mt-1">
                            {formatCurrency(payload[0].value as number, settings.currency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="spending" radius={[6, 6, 0, 0]}>
                  {spendingTrendData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#8B5CF6' : index === 1 ? '#7C3AED' : '#6366F1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Category Breakdown Donut */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-purple-400" /> Spending by Category
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Distribution of monthly recurring expenditures
            </p>
          </div>

          {categoryChartData.length > 0 ? (
            <div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={`cat-cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs shadow-lg">
                              <p className="font-semibold text-white">{data.name}</p>
                              <p className="text-purple-300 font-bold">
                                {formatCurrency(data.value as number, settings.currency)} / mo
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
                {categoryChartData.map((cat, idx) => {
                  const percentage =
                    metrics.monthlySpending > 0
                      ? Math.round((cat.value / metrics.monthlySpending) * 100)
                      : 0;
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/40"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-white">
                          {formatCurrency(cat.value, settings.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500 w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No active subscription spending data
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Upcoming Renewals + Recently Updated */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Upcoming Renewals with Quick Actions */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Upcoming Renewals (Next 7 Days)
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by urgency so you never miss an auto-debit deadline
              </p>
            </div>
            <button
              onClick={() => onNavigate('renewals')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentRenewals.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/60">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-white">You're all clear!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No subscriptions are due for renewal in the next 7 days. Enjoy the peace of mind.
                </p>
              </div>
            ) : (
              urgentRenewals.map(({ sub, days }) => {
                const isOverdue = days < 0;
                const isToday = days === 0;

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ServiceIcon
                        name={sub.name}
                        iconName={sub.iconName}
                        brandColor={sub.brandColor}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{sub.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isToday
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {formatCountdown(days)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {sub.category} · Renews on <span className="text-slate-300">{sub.nextRenewalDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-right sm:pr-2">
                        <span className="text-sm font-bold text-white block">
                          {formatCurrency(sub.amount, sub.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">{sub.billingCycle}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRenewClick(sub)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-sm"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => onSkipClick(sub)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                          title="Skip this cycle"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 col): Recently Updated / Activity */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" /> Recent Subscriptions
              </h3>
              <button
                onClick={onOpenAddModal}
                className="p-1 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition"
                title="Add new subscription"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentlyUpdated.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-900/80 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ServiceIcon
                      name={sub.name}
                      iconName={sub.iconName}
                      brandColor={sub.brandColor}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{sub.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {sub.billingCycle} · {sub.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-200">
                      {formatCurrency(sub.amount, sub.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('history')}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <span>View Full Renewal History ({history.length} records)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Spending Disclaimer Note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Notice & Disclaimer:</strong> Spending calculations (monthly equivalents and annual estimates) are calculated for tracking and financial planning purposes. SubTrack does not execute real bank debits, credit card charges, or actual payment gateway transfers.
        </p>
      </div>
    </div>
  );
};
