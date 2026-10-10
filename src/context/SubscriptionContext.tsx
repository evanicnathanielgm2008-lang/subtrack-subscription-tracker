import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Subscription,
  RenewalHistoryItem,
  UserSettings,
} from '../types';
import {
  calculateSpendingMetrics,
  advanceRenewalDate,
  checkDuplicateSubscription,
  SpendingMetrics,
} from '../utils/calculations';
import { storageService, DEFAULT_SETTINGS } from '../services/storage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface SubscriptionContextType {
  subscriptions: Subscription[];
  history: RenewalHistoryItem[];
  settings: UserSettings;
  metrics: SpendingMetrics;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;

  // Subscription Actions
  addSubscription: (
    data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>,
    bypassDuplicateCheck?: boolean
  ) => { success: boolean; duplicate?: Subscription; newSub?: Subscription };
  updateSubscription: (
    id: string,
    data: Partial<Subscription>,
    bypassDuplicateCheck?: boolean
  ) => { success: boolean; duplicate?: Subscription };
  deleteSubscription: (id: string) => void;
  renewSubscription: (id: string, customNotes?: string) => void;
  cancelSubscription: (id: string, customNotes?: string) => void;
  skipSubscription: (id: string, customNotes?: string) => void;
  reactivateSubscription: (id: string) => void;

  // Settings & Management
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetToDemoData: () => void;
  removeDemoData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; message: string };
  exportHistoryCSV: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    storageService.getSubscriptions()
  );
  const [history, setHistory] = useState<RenewalHistoryItem[]>(() =>
    storageService.getHistory()
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    storageService.getSettings()
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notification helper
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    storageService.saveSubscriptions(subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    storageService.saveHistory(history);
  }, [history]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  // Derived metrics
  const metrics = useMemo(() => {
    return calculateSpendingMetrics(subscriptions);
  }, [subscriptions]);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'],
      });
    } catch {
      // Ignore if confetti fails in headless env
    }
  }, []);

  // ADD Subscription
  const addSubscription = useCallback(
    (
      data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>,
      bypassDuplicateCheck = false
    ) => {
      if (!bypassDuplicateCheck) {
        const duplicate = checkDuplicateSubscription(subscriptions, {
          name: data.name,
          billingCycle: data.billingCycle,
          nextRenewalDate: data.nextRenewalDate,
        });
        if (duplicate) {
          return { success: false, duplicate };
        }
      }

      const now = new Date().toISOString();
      const newSub: Subscription = {
        ...data,
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };

      setSubscriptions((prev) => [newSub, ...prev]);
      showToast(`Added "${newSub.name}" successfully!`, 'success');
      return { success: true, newSub };
    },
    [subscriptions, showToast]
  );

  // UPDATE Subscription
  const updateSubscription = useCallback(
    (
      id: string,
      updates: Partial<Subscription>,
      bypassDuplicateCheck = false
    ) => {
      const existing = subscriptions.find((s) => s.id === id);
      if (!existing) return { success: false };

      if (!bypassDuplicateCheck) {
        const candidate = {
          name: updates.name !== undefined ? updates.name : existing.name,
          billingCycle: updates.billingCycle !== undefined ? updates.billingCycle : existing.billingCycle,
          nextRenewalDate: updates.nextRenewalDate !== undefined ? updates.nextRenewalDate : existing.nextRenewalDate,
        };
        const duplicate = checkDuplicateSubscription(subscriptions, candidate, id);
        if (duplicate) {
          return { success: false, duplicate };
        }
      }

      const now = new Date().toISOString();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, ...updates, updatedAt: now } : sub))
      );
      showToast(`Updated "${updates.name || existing.name}" successfully!`, 'success');
      return { success: true };
    },
    [subscriptions, showToast]
  );

  // DELETE Subscription
  const deleteSubscription = useCallback(
    (id: string) => {
      const existing = subscriptions.find((s) => s.id === id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showToast(
        existing ? `Deleted "${existing.name}".` : 'Subscription removed.',
        'info'
      );
    },
    [subscriptions, showToast]
  );

  // RENEW Subscription
  const renewSubscription = useCallback(
    (id: string, customNotes?: string) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;

      const previousDate = sub.nextRenewalDate;
      const nextDate = advanceRenewalDate(sub.nextRenewalDate, sub.billingCycle);
      const now = new Date().toISOString();

      // Create history record
      const historyItem: RenewalHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        previousRenewalDate: previousDate,
        newRenewalDate: nextDate,
        amount: sub.amount,
        currency: sub.currency,
        action: 'Renewed',
        dateOfAction: now,
        notes: customNotes || `Renewed for next ${sub.billingCycle} cycle.`,
      };

      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                nextRenewalDate: nextDate,
                status: 'Renewed',
                updatedAt: now,
              }
            : item
        )
      );

      setHistory((prev) => [historyItem, ...prev]);
      triggerConfetti();
      showToast(`Renewed "${sub.name}"! Next renewal is ${nextDate}.`, 'success');
    },
    [subscriptions, triggerConfetti, showToast]
  );

  // CANCEL Subscription
  const cancelSubscription = useCallback(
    (id: string, customNotes?: string) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;

      const now = new Date().toISOString();
      const historyItem: RenewalHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        previousRenewalDate: sub.nextRenewalDate,
        amount: sub.amount,
        currency: sub.currency,
        action: 'Cancelled',
        dateOfAction: now,
        notes: customNotes || 'Cancelled to avoid recurring payment.',
      };

      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'Cancelled',
                updatedAt: now,
              }
            : item
        )
      );

      setHistory((prev) => [historyItem, ...prev]);
      showToast(`Marked "${sub.name}" as Cancelled.`, 'info');
    },
    [subscriptions, showToast]
  );

  // SKIP Subscription
  const skipSubscription = useCallback(
    (id: string, customNotes?: string) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;

      const previousDate = sub.nextRenewalDate;
      const nextDate = advanceRenewalDate(sub.nextRenewalDate, sub.billingCycle);
      const now = new Date().toISOString();

      const historyItem: RenewalHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        category: sub.category,
        previousRenewalDate: previousDate,
        newRenewalDate: nextDate,
        amount: sub.amount,
        currency: sub.currency,
        action: 'Skipped',
        dateOfAction: now,
        notes: customNotes || `Renewal skipped. Next check on ${nextDate}.`,
      };

      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                nextRenewalDate: nextDate,
                status: 'Skipped',
                updatedAt: now,
              }
            : item
        )
      );

      setHistory((prev) => [historyItem, ...prev]);
      showToast(`Skipped cycle for "${sub.name}". Next date: ${nextDate}`, 'info');
    },
    [subscriptions, showToast]
  );

  // REACTIVATE Subscription
  const reactivateSubscription = useCallback(
    (id: string) => {
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return;

      const now = new Date().toISOString();
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'Active',
                updatedAt: now,
              }
            : item
        )
      );
      showToast(`Reactivated "${sub.name}"!`, 'success');
    },
    [subscriptions, showToast]
  );

  // SETTINGS
  const updateSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      showToast('Settings saved successfully.', 'success');
    },
    [showToast]
  );

  // Reset Demo Data
  const resetToDemoData = useCallback(() => {
    const data = storageService.resetDemoData();
    setSubscriptions(data.subscriptions);
    setHistory(data.history);
    showToast('Loaded demo subscription dataset.', 'success');
  }, [showToast]);

  // Remove Demo Data
  const removeDemoData = useCallback(() => {
    const updated = storageService.removeDemoData(subscriptions);
    setSubscriptions(updated);
    showToast('Removed demo records.', 'info');
  }, [subscriptions, showToast]);

  // Clear All Data
  const clearAllData = useCallback(() => {
    storageService.clearAll();
    setSubscriptions([]);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    showToast('Cleared all subscription data.', 'info');
  }, [showToast]);

  // Export JSON
  const exportDataJSON = useCallback(() => {
    const payload = {
      app: 'SubTrack',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      subscriptions,
      history,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  }, [subscriptions, history, settings]);

  // Import JSON
  const importDataJSON = useCallback(
    (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data.subscriptions)) {
          return { success: false, message: 'Invalid format: missing subscriptions array.' };
        }
        setSubscriptions(data.subscriptions);
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        }
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        showToast('Data imported successfully!', 'success');
        return { success: true, message: 'Import completed successfully.' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'JSON parse error';
        return { success: false, message: `Failed to import: ${msg}` };
      }
    },
    [showToast]
  );

  // Export History CSV
  const exportHistoryCSV = useCallback(() => {
    if (history.length === 0) {
      showToast('No history records to export.', 'warning');
      return;
    }

    const headers = ['Subscription Name', 'Category', 'Action', 'Amount', 'Currency', 'Previous Renewal', 'New Renewal', 'Date of Action', 'Notes'];
    const rows = history.map((h) => [
      `"${h.subscriptionName.replace(/"/g, '""')}"`,
      `"${h.category}"`,
      `"${h.action}"`,
      h.amount,
      `"${h.currency}"`,
      `"${h.previousRenewalDate}"`,
      `"${h.newRenewalDate || ''}"`,
      `"${h.dateOfAction}"`,
      `"${(h.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subtrack_renewal_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported history as CSV file.', 'success');
  }, [history, showToast]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        history,
        settings,
        metrics,
        toasts,
        showToast,
        dismissToast,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        renewSubscription,
        cancelSubscription,
        skipSubscription,
        reactivateSubscription,
        updateSettings,
        resetToDemoData,
        removeDemoData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
        exportHistoryCSV,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
};
