import React from 'react';
import { PageId } from '../types';
import { useSubscriptions } from '../context/SubscriptionContext';
import {
  LayoutDashboard,
  CreditCard,
  CalendarClock,
  PieChart,
  History,
  Settings,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenAddModal,
}) => {
  const { metrics, resetToDemoData } = useSubscriptions();

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number | string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'subscriptions',
      label: 'All Subscriptions',
      icon: <CreditCard className="w-5 h-5 shrink-0" />,
      badge: metrics.activeCount,
    },
    {
      id: 'renewals',
      label: 'Upcoming Renewals',
      icon: <CalendarClock className="w-5 h-5 shrink-0" />,
      badge: metrics.upcomingRenewals7DaysCount > 0 ? `${metrics.upcomingRenewals7DaysCount} due` : undefined,
      badgeColor: metrics.overdueCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      id: 'insights',
      label: 'Spending Insights',
      icon: <PieChart className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'history',
      label: 'Renewal History',
      icon: <History className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0B0F19] border-r border-slate-800/80 transition-all duration-300 relative z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">SubTrack</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Renewal & Spending Tracker</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className={`${isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </div>

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action & Persistence Info */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Offline Demo Safe
              </span>
              <button
                onClick={resetToDemoData}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                title="Reset to sample dataset"
              >
                Reset Demo
              </button>
            </div>
            <p className="text-[11px] leading-tight text-slate-400">
              Data is saved automatically in your browser localStorage.
            </p>
          </div>
        ) : (
          <button
            onClick={resetToDemoData}
            className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
            title="Reset Demo Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenAddModal}
          className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2 ${
            collapsed ? 'px-0' : ''
          }`}
          title="Add Subscription"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {!collapsed && <span>+ Add Subscription</span>}
        </button>
      </div>
    </aside>
  );
};
