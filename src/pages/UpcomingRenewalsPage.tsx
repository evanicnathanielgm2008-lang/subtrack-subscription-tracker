import React, { useState } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { Subscription } from '../types';
import {
  formatCurrency,
  getDaysUntilRenewal,
  formatCountdown,
  getRenewalUrgency,
  RenewalUrgency,
} from '../utils/calculations';
import { ServiceIcon } from '../components/ServiceIcon';
import {
  CalendarClock,
  AlertTriangle,
  Zap,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UpcomingRenewalsPageProps {
  onOpenAddModal: () => void;
  onRenewClick: (sub: Subscription) => void;
  onSkipClick: (sub: Subscription) => void;
  onCancelClick: (sub: Subscription) => void;
}

export const UpcomingRenewalsPage: React.FC<UpcomingRenewalsPageProps> = ({
  onOpenAddModal,
  onRenewClick,
  onSkipClick,
  onCancelClick,
}) => {
  const { subscriptions, settings } = useSubscriptions();

  // Filter out cancelled subscriptions
  const activeSubs = subscriptions.filter((s) => s.status !== 'Cancelled');

  // Categorize by urgency
  const categorized: Record<RenewalUrgency, { sub: Subscription; days: number }[]> = {
    Overdue: [],
    'Due today': [],
    'Due within 3 days': [],
    'Due within 7 days': [],
    'Due later': [],
  };

  let totalDueNext7Days = 0;
  let totalDueNext14Days = 0;
  let totalDueNext30Days = 0;

  for (const sub of activeSubs) {
    const days = getDaysUntilRenewal(sub.nextRenewalDate);
    const urgency = getRenewalUrgency(sub.nextRenewalDate, sub.status);

    categorized[urgency].push({ sub, days });

    if (days >= 0 && days <= 7) totalDueNext7Days += sub.amount;
    if (days >= 0 && days <= 14) totalDueNext14Days += sub.amount;
    if (days >= 0 && days <= 30) totalDueNext30Days += sub.amount;
  }

  // Sort each group by days
  Object.keys(categorized).forEach((key) => {
    categorized[key as RenewalUrgency].sort((a, b) => a.days - b.days);
  });

  const sections: {
    urgency: RenewalUrgency;
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeStyle: string;
    containerStyle: string;
  }[] = [
    {
      urgency: 'Overdue',
      title: '🚨 Overdue Subscriptions',
      description: 'Past renewal date. Action required to reconcile accounts.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      containerStyle: 'border-rose-500/40 bg-rose-950/10',
    },
    {
      urgency: 'Due today',
      title: '⚡ Due Today',
      description: 'Scheduled for renewal today. Verify card balance or auto-debit.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      containerStyle: 'border-amber-500/40 bg-amber-950/10',
    },
    {
      urgency: 'Due within 3 days',
      title: '⏳ Due Within 3 Days',
      description: 'Urgent renewals upcoming very soon.',
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      containerStyle: 'border-purple-500/30 bg-purple-950/10',
    },
    {
      urgency: 'Due within 7 days',
      title: '📅 Due Within 7 Days',
      description: 'Renewals due this week.',
      icon: <Calendar className="w-5 h-5 text-indigo-400" />,
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      containerStyle: 'border-indigo-500/30 bg-[#0F172A]',
    },
    {
      urgency: 'Due later',
      title: '🗓️ Due Later (Next 30+ Days)',
      description: 'Future commitments in good standing.',
      icon: <CalendarClock className="w-5 h-5 text-slate-400" />,
      badgeStyle: 'bg-slate-800 text-slate-400 border-slate-700',
      containerStyle: 'border-slate-800 bg-[#0F172A]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Cash Requirement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-amber-500/30">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Needed in Next 7 Days
          </span>
          <h3 className="text-xl font-bold text-white">
            {formatCurrency(totalDueNext7Days, settings.currency)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Immediate cash commitments
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-purple-500/30">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-1">
            Needed in Next 14 Days
          </span>
          <h3 className="text-xl font-bold text-white">
            {formatCurrency(totalDueNext14Days, settings.currency)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Bi-weekly planning total
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-indigo-500/30">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
            Needed in Next 30 Days
          </span>
          <h3 className="text-xl font-bold text-white">
            {formatCurrency(totalDueNext30Days, settings.currency)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Full month cash projection
          </p>
        </div>
      </div>

      {/* Sections by Urgency */}
      {sections.map(({ urgency, title, description, icon, badgeStyle, containerStyle }) => {
        const items = categorized[urgency];
        if (items.length === 0) return null;

        return (
          <div
            key={urgency}
            className={`p-5 rounded-2xl border ${containerStyle} space-y-4`}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {title}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {items.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>
              </div>
            </div>

            {/* Subscriptions List */}
            <div className="space-y-2.5">
              {items.map(({ sub, days }) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ServiceIcon
                      name={sub.name}
                      iconName={sub.iconName}
                      brandColor={sub.brandColor}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{sub.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                          {formatCountdown(days)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sub.category} · Next renewal date: <strong className="text-slate-200">{sub.nextRenewalDate}</strong>
                        {sub.paymentMethod && ` · Via ${sub.paymentMethod}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                    <div className="text-right sm:pr-2">
                      <span className="text-base font-extrabold text-white block">
                        {formatCurrency(sub.amount, sub.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        /{sub.billingCycle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRenewClick(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-md shadow-purple-600/20"
                        title="Confirm Renewal & calculate next cycle"
                      >
                        Renew Now
                      </button>
                      <button
                        onClick={() => onSkipClick(sub)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                        title="Skip this cycle"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => onCancelClick(sub)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Cancel subscription"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {activeSubs.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#0F172A] border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">No Active Renewals</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            You do not currently have any active subscriptions tracked in SubTrack.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
          >
            + Add Subscription
          </button>
        </div>
      )}
    </div>
  );
};
