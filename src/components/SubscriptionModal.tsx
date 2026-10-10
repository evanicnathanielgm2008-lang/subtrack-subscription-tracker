import React, { useState, useEffect } from 'react';
import {
  Subscription,
  SubscriptionCategory,
  BillingCycle,
  UsageFrequency,
} from '../types';
import { useSubscriptions } from '../context/SubscriptionContext';
import {
  CATEGORIES,
  CURRENCIES,
  POPULAR_SERVICES,
  PAYMENT_METHODS,
} from '../utils/constants';
import {
  calculateMonthlyEquivalent,
  calculateYearlyEstimate,
  advanceRenewalDate,
  formatCurrency,
} from '../utils/calculations';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { ServiceIcon } from './ServiceIcon';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: Subscription | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit,
}) => {
  const { addSubscription, updateSubscription, settings } = useSubscriptions();

  const isEdit = Boolean(subscriptionToEdit);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('Entertainment');
  const [amount, setAmount] = useState<string>('499');
  const [currency, setCurrency] = useState<string>(settings.currency || 'INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [nextRenewalDate, setNextRenewalDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('HDFC Credit Card');
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>('');
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency>('daily');
  const [brandColor, setBrandColor] = useState<string>('#8B5CF6');
  const [iconName, setIconName] = useState<string>('Tv');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<Subscription['status']>('Active');

  // Validation & Duplicate state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateSub, setDuplicateSub] = useState<Subscription | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name);
      setCategory(subscriptionToEdit.category);
      setAmount(subscriptionToEdit.amount.toString());
      setCurrency(subscriptionToEdit.currency);
      setBillingCycle(subscriptionToEdit.billingCycle);
      setStartDate(subscriptionToEdit.startDate);
      setNextRenewalDate(subscriptionToEdit.nextRenewalDate);
      if (PAYMENT_METHODS.includes(subscriptionToEdit.paymentMethod || '')) {
        setPaymentMethod(subscriptionToEdit.paymentMethod || 'Other');
        setCustomPaymentMethod('');
      } else {
        setPaymentMethod('Other');
        setCustomPaymentMethod(subscriptionToEdit.paymentMethod || '');
      }
      setReminderDays(subscriptionToEdit.reminderDaysBefore);
      setUsageFrequency(subscriptionToEdit.usageFrequency || 'daily');
      setBrandColor(subscriptionToEdit.brandColor || '#8B5CF6');
      setIconName(subscriptionToEdit.iconName || 'Tv');
      setNotes(subscriptionToEdit.notes || '');
      setStatus(subscriptionToEdit.status);
    } else {
      // Default new subscription values
      const today = new Date().toISOString().split('T')[0];
      const initialRenewal = advanceRenewalDate(today, 'monthly');
      setName('');
      setCategory('Entertainment');
      setAmount('499');
      setCurrency(settings.currency || 'INR');
      setBillingCycle('monthly');
      setStartDate(today);
      setNextRenewalDate(initialRenewal);
      setPaymentMethod('HDFC Credit Card');
      setCustomPaymentMethod('');
      setReminderDays(settings.defaultReminderDays || 3);
      setUsageFrequency('daily');
      setBrandColor('#8B5CF6');
      setIconName('Tv');
      setNotes('');
      setStatus('Active');
    }
    setErrors({});
    setDuplicateSub(null);
    setShowDuplicateWarning(false);
  }, [isOpen, subscriptionToEdit, settings]);

  if (!isOpen) return null;

  // Real-time calculation helpers
  const parsedAmount = parseFloat(amount) || 0;
  const monthlyEq = calculateMonthlyEquivalent(parsedAmount, billingCycle);
  const yearlyEst = calculateYearlyEstimate(parsedAmount, billingCycle);

  // Quick preset apply
  const applyPreset = (preset: (typeof POPULAR_SERVICES)[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setAmount(preset.defaultAmount.toString());
    setBillingCycle(preset.cycle);
    setBrandColor(preset.color);
    setIconName(preset.icon);

    // Recalculate renewal date based on cycle
    const currentStart = startDate || new Date().toISOString().split('T')[0];
    setNextRenewalDate(advanceRenewalDate(currentStart, preset.cycle));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Subscription name is required';
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Amount must be a positive number greater than 0';
    }
    if (!startDate) {
      errs.startDate = 'Start date is required';
    }
    if (!nextRenewalDate) {
      errs.nextRenewalDate = 'Next renewal date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e?: React.FormEvent, bypass = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const finalPaymentMethod =
      paymentMethod === 'Other' ? (customPaymentMethod.trim() || 'Other') : paymentMethod;

    const payload = {
      name: name.trim(),
      category,
      amount: parsedAmount,
      currency,
      billingCycle,
      startDate,
      nextRenewalDate,
      paymentMethod: finalPaymentMethod,
      reminderDaysBefore: reminderDays,
      usageFrequency,
      brandColor,
      iconName,
      notes: notes.trim(),
      status,
    };

    if (isEdit && subscriptionToEdit) {
      const res = updateSubscription(subscriptionToEdit.id, payload, bypass);
      if (!res.success && res.duplicate) {
        setDuplicateSub(res.duplicate);
        setShowDuplicateWarning(true);
        return;
      }
    } else {
      const res = addSubscription(payload, bypass);
      if (!res.success && res.duplicate) {
        setDuplicateSub(res.duplicate);
        setShowDuplicateWarning(true);
        return;
      }
    }

    onClose();
  };

  const handleConfirmBypass = () => {
    setShowDuplicateWarning(false);
    handleFormSubmit(undefined, true);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
          {/* Top Header bar with purple gradient accent */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600" />

          <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <ServiceIcon
                name={name || 'New'}
                iconName={iconName}
                brandColor={brandColor}
                size="md"
              />
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isEdit ? 'Edit Subscription' : 'Add New Subscription'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isEdit
                    ? 'Update billing details and renewal rules'
                    : 'Track renewals and calculate recurring expenses'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={(e) => handleFormSubmit(e, false)} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Quick Presets (Only when adding new) */}
            {!isEdit && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Autofill Presets
                  </label>
                  <span className="text-[11px] text-slate-400">Click to autofill details</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  {POPULAR_SERVICES.slice(0, 8).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-700/60 text-slate-200 hover:text-white transition flex items-center gap-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: preset.color }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info: Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subscription Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix, GitHub Pro, Gym"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    errors.name ? 'border-rose-500' : 'border-slate-700 focus:border-purple-500'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category <span className="text-purple-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.label} value={cat.label}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Billing Cycle */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Amount Due <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none ${
                        errors.amount ? 'border-rose-500' : 'border-slate-700 focus:border-purple-500'
                      }`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.amount}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Billing Cycle <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => {
                      const newCycle = e.target.value as BillingCycle;
                      setBillingCycle(newCycle);
                      // Adjust renewal date according to new cycle
                      if (startDate) {
                        setNextRenewalDate(advanceRenewalDate(startDate, newCycle));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Spending Calculation Box */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 text-xs">
                <span className="text-slate-400">Equivalent Estimates:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Monthly eq:</span>
                    <span className="font-semibold text-purple-300">
                      {formatCurrency(monthlyEq, currency, 2)}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-purple-500/30" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Yearly est:</span>
                    <span className="font-semibold text-indigo-300">
                      {formatCurrency(yearlyEst, currency, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates: Start Date & Next Renewal Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Start Date <span className="text-purple-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart && !isEdit) {
                      setNextRenewalDate(advanceRenewalDate(newStart, billingCycle));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-sm text-white focus:outline-none ${
                    errors.startDate ? 'border-rose-500' : 'border-slate-700 focus:border-purple-500'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-rose-400">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Next Renewal Date <span className="text-purple-400">*</span>
                </label>
                <input
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-sm text-white focus:outline-none ${
                    errors.nextRenewalDate
                      ? 'border-rose-500'
                      : 'border-slate-700 focus:border-purple-500'
                  }`}
                />
                {errors.nextRenewalDate && (
                  <p className="mt-1 text-xs text-rose-400">{errors.nextRenewalDate}</p>
                )}
              </div>
            </div>

            {/* Reminders & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Renewal Reminder
                </label>
                <select
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>1 day before renewal</option>
                  <option value={3}>3 days before renewal</option>
                  <option value={7}>7 days before renewal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method (Optional)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
                {paymentMethod === 'Other' && (
                  <input
                    type="text"
                    value={customPaymentMethod}
                    onChange={(e) => setCustomPaymentMethod(e.target.value)}
                    placeholder="Enter custom payment method"
                    className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>
            </div>

            {/* Status & Usage Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Subscription['status'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled (Preserve records & calculate savings)</option>
                  <option value="Skipped">Skipped</option>
                  <option value="Renewed">Renewed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Usage Frequency (For Smart Review)
                </label>
                <select
                  value={usageFrequency}
                  onChange={(e) => setUsageFrequency(e.target.value as UsageFrequency)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="daily">Daily / High usage</option>
                  <option value="weekly">Weekly / Moderate usage</option>
                  <option value="rarely">Rarely used (audit candidate)</option>
                  <option value="never">Never used (recommend cancel)</option>
                </select>
              </div>
            </div>

            {/* Custom Brand Color & Icon Selection */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Brand Appearance
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[
                    '#8B5CF6',
                    '#3B82F6',
                    '#10B981',
                    '#EC4899',
                    '#F59E0B',
                    '#E50914',
                    '#1DB954',
                    '#0056D2',
                    '#10A37F',
                    '#475569',
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBrandColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        brandColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Tv">Tv (Streaming)</option>
                  <option value="Headphones">Headphones (Music)</option>
                  <option value="Code">Code (Dev Tools)</option>
                  <option value="GraduationCap">Graduation (Courses)</option>
                  <option value="Sparkles">Sparkles (AI)</option>
                  <option value="Film">Film (Cinema)</option>
                  <option value="FileText">Document (Notes)</option>
                  <option value="Palette">Palette (Design)</option>
                  <option value="Cloud">Cloud (Storage)</option>
                  <option value="Dumbbell">Dumbbell (Fitness)</option>
                  <option value="Zap">Zap (Utilities)</option>
                  <option value="Gamepad2">Gamepad (Gaming)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Plan details, account credentials reminder, or cancellation terms..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                {isEdit ? 'Save Changes' : 'Create Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        onConfirmBypass={handleConfirmBypass}
        existingSub={duplicateSub}
        candidateName={name}
        candidateAmount={parsedAmount}
        candidateCycle={billingCycle}
        candidateDate={nextRenewalDate}
        currency={currency}
      />
    </>
  );
};
