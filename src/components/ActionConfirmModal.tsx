import React, { useState } from 'react';
import { Subscription } from '../types';
import { advanceRenewalDate, formatCurrency } from '../utils/calculations';
import { AlertCircle, CheckCircle, Clock, Trash2, XCircle, X } from 'lucide-react';
import { ServiceIcon } from './ServiceIcon';

export type ActionType = 'renew' | 'cancel' | 'skip' | 'delete';

interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  actionType: ActionType;
  onConfirm: (notes?: string) => void;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  subscription,
  actionType,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen || !subscription) return null;

  const nextCalculatedDate = advanceRenewalDate(
    subscription.nextRenewalDate,
    subscription.billingCycle
  );

  const handleAction = () => {
    onConfirm(notes.trim() || undefined);
    setNotes('');
    onClose();
  };

  const config = {
    renew: {
      title: 'Renew Subscription',
      subtitle: 'Record renewal and push next renewal deadline forward',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      accentColor: 'border-emerald-500/40',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20',
      btnText: 'Confirm Renewal',
      description: (
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            You are renewing <span className="font-semibold text-white">{subscription.name}</span> for{' '}
            <span className="font-semibold text-white">{formatCurrency(subscription.amount, subscription.currency)}</span>.
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400 block">Current Renewal</span>
              <span className="font-medium text-slate-200">{subscription.nextRenewalDate}</span>
            </div>
            <span className="text-slate-500">➔</span>
            <div>
              <span className="text-emerald-400 block font-semibold">New Renewal Date</span>
              <span className="font-bold text-emerald-300">{nextCalculatedDate}</span>
            </div>
          </div>
        </div>
      ),
    },
    cancel: {
      title: 'Cancel Subscription',
      subtitle: 'Mark inactive to eliminate upcoming alerts and calculate savings',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
      accentColor: 'border-rose-500/40',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20',
      btnText: 'Confirm Cancellation',
      description: (
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            Are you sure you want to cancel <span className="font-semibold text-white">{subscription.name}</span>?
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This will stop future renewal reminders and add this subscription to your potential yearly savings. Your historical spending records will remain intact.
          </p>
        </div>
      ),
    },
    skip: {
      title: 'Skip Renewal Cycle',
      subtitle: 'Advance next renewal date without recording a payment',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      accentColor: 'border-amber-500/40',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
      btnText: 'Confirm Skip',
      description: (
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            Skipping the current cycle for <span className="font-semibold text-white">{subscription.name}</span>.
          </p>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400 block">Skipped Date</span>
              <span className="font-medium text-slate-300">{subscription.nextRenewalDate}</span>
            </div>
            <span className="text-slate-500">➔</span>
            <div>
              <span className="text-amber-400 block font-semibold">Next Check Date</span>
              <span className="font-bold text-amber-300">{nextCalculatedDate}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            No spending is recorded for this skipped cycle. Useful if you paused the service or received a free credit.
          </p>
        </div>
      ),
    },
    delete: {
      title: 'Delete Subscription',
      subtitle: 'Permanently delete this subscription and remove from your tracker',
      icon: <Trash2 className="w-5 h-5 text-rose-400" />,
      accentColor: 'border-rose-500/40',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20',
      btnText: 'Permanently Delete',
      description: (
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            Are you sure you want to delete <span className="font-semibold text-white">{subscription.name}</span>?
          </p>
          <p className="text-xs text-rose-300/80 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
            ⚠️ This action cannot be undone. If you just want to stop tracking renewals, consider <span className="font-semibold text-white">Cancelling</span> it instead to preserve your stats.
          </p>
        </div>
      ),
    },
  }[actionType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md bg-[#0F172A] border ${config.accentColor} rounded-2xl shadow-2xl p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{config.title}</h3>
              <p className="text-xs text-slate-400">{config.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subscription Header */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
          <ServiceIcon
            name={subscription.name}
            iconName={subscription.iconName}
            brandColor={subscription.brandColor}
            size="md"
          />
          <div>
            <h4 className="font-semibold text-white text-sm">{subscription.name}</h4>
            <span className="text-xs text-slate-400">
              {subscription.category} · {subscription.billingCycle}
            </span>
          </div>
        </div>

        {/* Action Description */}
        <div className="mb-4">{config.description}</div>

        {/* Optional notes input (except for delete) */}
        {actionType !== 'delete' && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Add note for renewal history (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via HDFC credit card, renewed for project..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAction}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition ${config.btnColor}`}
          >
            {config.btnText}
          </button>
        </div>
      </div>
    </div>
  );
};
