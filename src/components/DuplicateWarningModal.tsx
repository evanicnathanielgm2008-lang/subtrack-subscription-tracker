import React from 'react';
import { Subscription } from '../types';
import { formatCurrency } from '../utils/calculations';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { ServiceIcon } from './ServiceIcon';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBypass: () => void;
  existingSub: Subscription | null;
  candidateName: string;
  candidateAmount: number;
  candidateCycle: string;
  candidateDate: string;
  currency: string;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirmBypass,
  existingSub,
  candidateName,
  candidateAmount,
  candidateCycle,
  candidateDate,
  currency,
}) => {
  if (!isOpen || !existingSub) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Possible Duplicate Detected</h3>
              <p className="text-xs text-amber-300/80 font-medium">Review before saving to prevent duplicate tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          You already have an active subscription for <span className="font-semibold text-white">"{existingSub.name}"</span> with the same billing cycle and renewal date.
        </p>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          {/* Existing */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
              Existing Subscription
            </span>
            <div className="flex items-center gap-2 mb-2">
              <ServiceIcon
                name={existingSub.name}
                iconName={existingSub.iconName}
                brandColor={existingSub.brandColor}
                size="sm"
              />
              <span className="font-semibold text-white truncate">{existingSub.name}</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p><span className="text-slate-400">Amount:</span> {formatCurrency(existingSub.amount, existingSub.currency)}</p>
              <p><span className="text-slate-400">Cycle:</span> {existingSub.billingCycle}</p>
              <p><span className="text-slate-400">Renewal:</span> {existingSub.nextRenewalDate}</p>
            </div>
          </div>

          {/* New Submission */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 block mb-2">
              New Entry Being Added
            </span>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-xs">
                {candidateName.charAt(0) || '+'}
              </div>
              <span className="font-semibold text-white truncate">{candidateName}</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p><span className="text-slate-400">Amount:</span> {formatCurrency(candidateAmount, currency)}</p>
              <p><span className="text-slate-400">Cycle:</span> {candidateCycle}</p>
              <p><span className="text-slate-400">Renewal:</span> {candidateDate}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Review & Edit
          </button>
          <button
            type="button"
            onClick={onConfirmBypass}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition"
          >
            Add Anyway (Allow Duplicate)
          </button>
        </div>
      </div>
    </div>
  );
};
