import React, { useState } from 'react';
import { PageId } from '../types';
import { useSubscriptions } from '../context/SubscriptionContext';
import { CURRENCIES } from '../utils/constants';
import { getDaysUntilRenewal } from '../utils/calculations';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Bell,
  Plus,
  Menu,
  X,
  CreditCard,
  Zap,
  Sparkles,
  Search,
  LayoutDashboard,
  CalendarClock,
  PieChart,
  History,
  Settings,
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenAddModal: () => void;
  onQuickRenew: (subId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAddModal,
  onQuickRenew,
}) => {
  const { subscriptions, settings, updateSettings, metrics } = useSubscriptions();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute urgent alerts count
  const activeSubs = subscriptions.filter((s) => s.status !== 'Cancelled');
  const alertCount = activeSubs.filter((sub) => {
    const days = getDaysUntilRenewal(sub.nextRenewalDate);
    const threshold = sub.reminderDaysBefore || settings.defaultReminderDays || 3;
    return days <= threshold;
  }).length;

  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Subscription Dashboard',
      subtitle: 'Overview of monthly spend, recurring commitments, and renewal deadlines',
    },
    subscriptions: {
      title: 'All Subscriptions',
      subtitle: `Managing ${metrics.activeCount} active subscriptions across categories`,
    },
    renewals: {
      title: 'Upcoming Renewals',
      subtitle: 'Urgent renewal calendar categorized by days remaining',
    },
    insights: {
      title: 'Spending Insights & Calculator',
      subtitle: 'Category distribution, savings audit, and projected expenditure',
    },
    history: {
      title: 'Renewal History',
      subtitle: 'Audit trail of past renewals, cancellations, and cycle adjustments',
    },
    settings: {
      title: 'Settings & Preferences',
      subtitle: 'Customize currency, renewal reminder thresholds, and backup data',
    },
  };

  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'All Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'renewals', label: 'Upcoming Renewals', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'insights', label: 'Spending Insights', icon: <PieChart className="w-4 h-4" /> },
    { id: 'history', label: 'Renewal History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
              {pageTitles[currentPage].title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-400">
              {pageTitles[currentPage].subtitle}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Currency Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 hidden sm:inline text-[11px] font-medium">Currency:</span>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition relative ${
                showNotifications
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="View renewal alerts"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#0B0F19] animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onNavigate={onNavigate}
              onQuickRenew={onQuickRenew}
            />
          </div>

          {/* New Subscription Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Subscription</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-72 h-full bg-[#0B0F19] border-r border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-base">SubTrack</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddModal();
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
