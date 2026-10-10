import React, { useRef, useEffect } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { getDaysUntilRenewal, formatCurrency, formatCountdown } from '../utils/calculations';
import { ServiceIcon } from './ServiceIcon';
import { Bell, AlertTriangle, Clock, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { PageId } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
  onQuickRenew: (subId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickRenew,
}) => {
  const { subscriptions, settings } = useSubscriptions();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter subscriptions that are overdue or due within reminder window
  const activeSubs = subscriptions.filter((s) => s.status !== 'Cancelled');
  const alertSubs = activeSubs
    .map((sub) => {
      const days = getDaysUntilRenewal(sub.nextRenewalDate);
      return { sub, days };
    })
    .filter(({ sub, days }) => {
      // Overdue (< 0) or due within user reminder preference
      const reminderThreshold = sub.reminderDaysBefore || settings.defaultReminderDays || 3;
      return days <= reminderThreshold;
    })
    .sort((a, b) => a.days - b.days);

  const overdueCount = alertSubs.filter((x) => x.days < 0).length;
  const dueTodayCount = alertSubs.filter((x) => x.days === 0).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Renewal Alerts</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {alertSubs.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary notice */}
      {overdueCount > 0 && (
        <div className="px-3.5 py-2 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {overdueCount} subscription{overdueCount > 1 ? 's are' : ' is'} overdue for renewal
          </span>
        </div>
      )}

      {/* Alert items list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {alertSubs.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-slate-200">No urgent renewals</p>
            <p className="text-xs text-slate-400 mt-1">
              All your subscriptions are currently up to date!
            </p>
          </div>
        ) : (
          alertSubs.map(({ sub, days }) => {
            const isOverdue = days < 0;
            const isToday = days === 0;

            return (
              <div
                key={sub.id}
                className="p-3.5 hover:bg-slate-900/80 transition flex items-center justify-between gap-3"
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-400'
                            : isToday
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {formatCountdown(days)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatCurrency(sub.amount, sub.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onQuickRenew(sub.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
                  >
                    Renew
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 text-center">
        <button
          onClick={() => {
            onNavigate('renewals');
            onClose();
          }}
          className="text-xs font-medium text-purple-400 hover:text-purple-300 transition flex items-center justify-center gap-1 w-full"
        >
          View all upcoming renewals <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
