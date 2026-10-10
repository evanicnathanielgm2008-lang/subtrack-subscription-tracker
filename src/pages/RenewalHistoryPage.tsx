import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { HistoryAction } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  History,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';

export const RenewalHistoryPage: React.FC = () => {
  const { history, exportHistoryCSV, settings } = useSubscriptions();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');

  // Filtered History
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    return history.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.subscriptionName.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesNotes) return false;
      }

      // Action Filter
      if (selectedAction !== 'All' && item.action !== selectedAction) {
        return false;
      }

      // Timeframe Filter
      if (selectedTimeframe !== 'all') {
        const itemTime = new Date(item.dateOfAction).getTime();
        const diffDays = (now - itemTime) / (1000 * 60 * 60 * 24);

        if (selectedTimeframe === '30' && diffDays > 30) return false;
        if (selectedTimeframe === '90' && diffDays > 90) return false;
        if (selectedTimeframe === 'year' && diffDays > 365) return false;
      }

      return true;
    });
  }, [history, searchQuery, selectedAction, selectedTimeframe]);

  // Summary counts
  const renewedCount = history.filter((h) => h.action === 'Renewed').length;
  const cancelledCount = history.filter((h) => h.action === 'Cancelled').length;
  const skippedCount = history.filter((h) => h.action === 'Skipped').length;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            Total History Records
          </span>
          <h3 className="text-2xl font-bold text-white">{history.length}</h3>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-emerald-500/30">
          <span className="text-xs font-semibold text-emerald-400 block mb-1">
            Renewals Recorded
          </span>
          <h3 className="text-2xl font-bold text-emerald-300">{renewedCount}</h3>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-rose-500/30">
          <span className="text-xs font-semibold text-rose-400 block mb-1">
            Cancellations Logged
          </span>
          <h3 className="text-2xl font-bold text-rose-300">{cancelledCount}</h3>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-amber-500/30">
          <span className="text-xs font-semibold text-amber-400 block mb-1">
            Cycles Skipped
          </span>
          <h3 className="text-2xl font-bold text-amber-300">{skippedCount}</h3>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by subscription name or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportHistoryCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shrink-0"
              title="Export complete history log to CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Actions</option>
              <option value="Renewed">Renewed Only</option>
              <option value="Cancelled">Cancelled Only</option>
              <option value="Skipped">Skipped Only</option>
            </select>

            {/* Timeframe Filter */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <span className="text-slate-400">
            Showing {filteredHistory.length} of {history.length} records
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <h4 className="text-sm font-semibold text-white">No history entries found</h4>
            <p className="text-xs mt-1 text-slate-500">
              {searchQuery || selectedAction !== 'All'
                ? 'Try clearing your filters.'
                : 'Renew or cancel a subscription to start recording history entries.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Prior Renewal</th>
                  <th className="py-3 px-4">New Renewal Date</th>
                  <th className="py-3 px-4">Date of Action</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => {
                  const badgeStyles = {
                    Renewed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    Cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    Skipped: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  }[item.action];

                  const icons = {
                    Renewed: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
                    Cancelled: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
                    Skipped: <Clock className="w-3.5 h-3.5 text-amber-400" />,
                  }[item.action];

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeStyles}`}
                        >
                          {icons}
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.subscriptionName}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.previousRenewalDate}
                      </td>
                      <td className="py-3 px-4">
                        {item.newRenewalDate ? (
                          <span className="font-semibold text-purple-300">
                            {item.newRenewalDate}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(item.dateOfAction)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={item.notes}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
