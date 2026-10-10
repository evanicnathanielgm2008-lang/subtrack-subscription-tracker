import React, { useState, useRef } from 'react';
import { useSubscriptions } from '../context/SubscriptionContext';
import { CURRENCIES } from '../utils/constants';
import {
  Settings,
  Bell,
  Coins,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Shield,
  HelpCircle,
  Flame,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    removeDemoData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
    showToast,
  } = useSubscriptions();

  const [jsonInput, setJsonInput] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Browser notification handler
  const requestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('This browser does not support desktop notifications.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSettings({ browserNotificationsEnabled: true });
        new Notification('SubTrack Notifications Enabled', {
          body: 'You will receive reminders when subscriptions are due!',
          icon: '/favicon.ico',
        });
        showToast('Browser notifications enabled and test sent!', 'success');
      } else {
        updateSettings({ browserNotificationsEnabled: false });
        showToast('Notification permission was denied or dismissed.', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not request notification permissions.', 'error');
    }
  };

  const handleDownloadJSON = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded JSON backup successfully.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        showToast('Backup restored successfully!', 'success');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    if (!jsonInput.trim()) return;
    const res = importDataJSON(jsonInput);
    if (res.success) {
      setJsonInput('');
      setShowImportBox(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. General & Currency Preferences */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Currency & Regional Preferences</h3>
            <p className="text-xs text-slate-400">
              Set your primary tracking currency (default INR ₹)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Default Display Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} — {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Default Reminder Horizon
            </label>
            <select
              value={settings.defaultReminderDays}
              onChange={(e) => updateSettings({ defaultReminderDays: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value={1}>1 day before renewal</option>
              <option value={3}>3 days before renewal (Recommended)</option>
              <option value={7}>7 days before renewal</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Notifications & Alert Settings */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Notification & Reminder System</h3>
            <p className="text-xs text-slate-400">
              Manage in-app alert badges and browser push notifications
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* In-app reminders notice */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">In-App Renewal Reminders</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays overdue warning banners, countdown badges, and header notification count for urgent renewals.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              Always Active
            </span>
          </div>

          {/* Browser push notifications */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Browser Desktop Notifications</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Request browser push alert permissions. Note: Background automated push requires active web service worker; in-app alerts are always active.
              </p>
            </div>
            <button
              onClick={requestBrowserNotifications}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                settings.browserNotificationsEnabled
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
              }`}
            >
              {settings.browserNotificationsEnabled
                ? 'Test Push Alert'
                : 'Enable Browser Alerts'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Demo Dataset & Reset Controls */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Demo Data Controls</h3>
            <p className="text-xs text-slate-400">
              One-click controls to restore sample subscriptions or clean them up
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={resetToDemoData}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-left transition hover:border-purple-500/50 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-purple-300">
                Reset Demo Dataset
              </span>
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Populates realistic sample data for Netflix, Spotify, YouTube Premium, GitHub, Coursera, etc.
            </p>
          </button>

          <button
            onClick={removeDemoData}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-left transition hover:border-amber-500/50 group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-amber-300">
                Remove Demo Records Only
              </span>
              <Trash2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Keeps all custom subscriptions you manually created and removes pre-loaded demo items.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Backup & Migration (Export / Import JSON) */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Backup & Export</h3>
            <p className="text-xs text-slate-400">
              Export and import complete subscription lists and renewal histories as JSON
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export Backup (JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Upload Backup File</span>
          </button>

          <button
            onClick={() => setShowImportBox(!showImportBox)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            {showImportBox ? 'Hide Paste Box' : 'Paste Raw JSON'}
          </button>
        </div>

        {showImportBox && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Paste exported JSON payload here
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={4}
              placeholder='{"app": "SubTrack", "subscriptions": [...]}'
              className="w-full p-3 rounded-xl bg-[#0B0F19] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setJsonInput('')}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={handleManualImport}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                Import JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Database Architecture Status */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Database & Persistence Engine</h3>
            <p className="text-xs text-slate-400">
              localStorage driver active with Firestore pluggable architecture
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SubTrack is configured to persist all changes immediately to browser storage (<code className="text-purple-300">localStorage</code>), ensuring instant offline access without requiring external API keys or credentials. The storage architecture is modularized in <code className="text-purple-300">/src/services/storage.ts</code>, ready for Firestore sync whenever backend accounts are connected.
        </p>
      </div>

      {/* 6. Danger Zone: Wipe All Data */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-rose-300">Danger Zone: Wipe All Data</h3>
            <p className="text-xs text-slate-400">
              Permanently delete all subscriptions, histories, and stored preferences
            </p>
          </div>

          {!showWipeConfirm ? (
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition"
            >
              Wipe Everything
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWipeConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowWipeConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-lg"
              >
                Confirm Wipe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
