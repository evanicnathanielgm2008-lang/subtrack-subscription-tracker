import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import {
  Subscription,
  SubscriptionCategory,
  BillingCycle,
  SubscriptionStatus,
} from '../types';
import { CATEGORIES } from '../utils/constants';
import {
  formatCurrency,
  getDaysUntilRenewal,
  formatCountdown,
  calculateMonthlyEquivalent,
  calculateYearlyEstimate,
} from '../utils/calculations';
import { ServiceIcon } from '../components/ServiceIcon';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  XCircle,
  RefreshCw,
  LayoutGrid,
  List,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpDown,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

interface SubscriptionsPageProps {
  onOpenAddModal: () => void;
  onEditClick: (sub: Subscription) => void;
  onRenewClick: (sub: Subscription) => void;
  onCancelClick: (sub: Subscription) => void;
  onSkipClick: (sub: Subscription) => void;
  onDeleteClick: (sub: Subscription) => void;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({
  onOpenAddModal,
  onEditClick,
  onRenewClick,
  onCancelClick,
  onSkipClick,
  onDeleteClick,
}) => {
  const { subscriptions, reactivateSubscription, settings } = useSubscriptions();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCycle, setSelectedCycle] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'renewal' | 'cost-desc' | 'cost-asc' | 'name'>('renewal');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filtered & Sorted list
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = sub.name.toLowerCase().includes(q);
          const matchesNotes = sub.notes?.toLowerCase().includes(q) || false;
          const matchesPayment = sub.paymentMethod?.toLowerCase().includes(q) || false;
          if (!matchesName && !matchesNotes && !matchesPayment) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && sub.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'All' && sub.status !== selectedStatus) {
          return false;
        }

        // Billing Cycle filter
        if (selectedCycle !== 'All' && sub.billingCycle !== selectedCycle) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'renewal') {
          // Put cancelled subs at the bottom
          if (a.status === 'Cancelled' && b.status !== 'Cancelled') return 1;
          if (a.status !== 'Cancelled' && b.status === 'Cancelled') return -1;
          return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime();
        }
        if (sortBy === 'cost-desc') {
          const aMonthly = calculateMonthlyEquivalent(a.amount, a.billingCycle);
          const bMonthly = calculateMonthlyEquivalent(b.amount, b.billingCycle);
          return bMonthly - aMonthly;
        }
        if (sortBy === 'cost-asc') {
          const aMonthly = calculateMonthlyEquivalent(a.amount, a.billingCycle);
          const bMonthly = calculateMonthlyEquivalent(b.amount, b.billingCycle);
          return aMonthly - bMonthly;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscriptions, searchQuery, selectedCategory, selectedStatus, selectedCycle, sortBy]);

  return (
    <div className="space-y-6">
      {/* Controls Header: Search, Filters, and Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
        {/* Search & Top Action row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriptions by name, payment method, or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        {/* Filter Badges & Sort Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Skipped">Skipped</option>
              <option value="Renewed">Renewed</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Billing Cycle Filter */}
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Billing Cycles</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="renewal">Renewal Date (Urgent First)</option>
              <option value="cost-desc">Cost (High to Low)</option>
              <option value="cost-asc">Cost (Low to High)</option>
              <option value="name">Service Name (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {filteredSubscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0F172A] border border-slate-800">
          <CreditCard className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No subscriptions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
              ? 'Try adjusting your search criteria or filter tags.'
              : 'Start tracking your recurring payments by adding your first subscription.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Subscription Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const days = getDaysUntilRenewal(sub.nextRenewalDate);
            const isCancelled = sub.status === 'Cancelled';
            const isOverdue = !isCancelled && days < 0;
            const isToday = !isCancelled && days === 0;
            const monthlyEq = calculateMonthlyEquivalent(sub.amount, sub.billingCycle);

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl bg-[#0F172A] border transition-all duration-200 flex flex-col justify-between group hover:shadow-xl ${
                  isCancelled
                    ? 'border-slate-800/60 opacity-75'
                    : isOverdue
                    ? 'border-rose-500/40 hover:border-rose-500/80'
                    : isToday
                    ? 'border-amber-500/40 hover:border-amber-500/80'
                    : 'border-slate-800 hover:border-purple-500/50'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name, Status & Cost */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ServiceIcon
                        name={sub.name}
                        iconName={sub.iconName}
                        brandColor={sub.brandColor}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{sub.name}</h4>
                        <span className="text-xs text-slate-400">{sub.category}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-white">
                        {formatCurrency(sub.amount, sub.currency)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        /{sub.billingCycle}
                      </span>
                    </div>
                  </div>

                  {/* Urgency Badge & Monthly Equivalent */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-3">
                    <span className="text-slate-400">Equivalent:</span>
                    <span className="font-semibold text-purple-300">
                      {formatCurrency(monthlyEq, sub.currency)}/mo
                    </span>
                  </div>

                  {/* Dates & Renewal Countdown */}
                  <div className="space-y-1.5 text-xs text-slate-300 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Renewal Date:</span>
                      <span className="font-semibold text-slate-200">{sub.nextRenewalDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Payment Via:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[130px]">
                        {sub.paymentMethod || 'Manual'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mb-4">
                    {isCancelled ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Cancelled (Savings active)
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isToday
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : days <= 7
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}
                      >
                        {formatCountdown(days)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {!isCancelled ? (
                      <>
                        <button
                          onClick={() => onRenewClick(sub)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-sm"
                          title="Record renewal"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => onSkipClick(sub)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                          title="Skip cycle"
                        >
                          Skip
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => reactivateSubscription(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClick(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit subscription"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isCancelled && (
                      <button
                        onClick={() => onCancelClick(sub)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Cancel subscription"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteClick(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Monthly Eq</th>
                  <th className="py-3 px-4">Next Renewal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubscriptions.map((sub) => {
                  const days = getDaysUntilRenewal(sub.nextRenewalDate);
                  const isCancelled = sub.status === 'Cancelled';
                  const monthlyEq = calculateMonthlyEquivalent(sub.amount, sub.billingCycle);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ServiceIcon
                            name={sub.name}
                            iconName={sub.iconName}
                            brandColor={sub.brandColor}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-white block">{sub.name}</span>
                            <span className="text-[10px] text-slate-400">{sub.billingCycle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">{sub.category}</td>
                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(sub.amount, sub.currency)}
                      </td>
                      <td className="py-3 px-4 text-purple-300 font-semibold">
                        {formatCurrency(monthlyEq, sub.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 block">
                          {sub.nextRenewalDate}
                        </span>
                        {!isCancelled && (
                          <span className="text-[10px] text-slate-400">
                            {formatCountdown(days)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCancelled
                              ? 'bg-slate-800 text-slate-400'
                              : sub.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCancelled ? (
                            <>
                              <button
                                onClick={() => onRenewClick(sub)}
                                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px]"
                              >
                                Renew
                              </button>
                              <button
                                onClick={() => onSkipClick(sub)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                              >
                                Skip
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => reactivateSubscription(sub.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px]"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => onEditClick(sub)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteClick(sub)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
