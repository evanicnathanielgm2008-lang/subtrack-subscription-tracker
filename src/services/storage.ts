import { Subscription, RenewalHistoryItem, UserSettings } from '../types';
import { INITIAL_SUBSCRIPTIONS, INITIAL_HISTORY } from '../utils/constants';

const SUBS_STORAGE_KEY = 'subtrack_subscriptions_v1';
const HISTORY_STORAGE_KEY = 'subtrack_history_v1';
const SETTINGS_STORAGE_KEY = 'subtrack_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'INR',
  defaultReminderDays: 3,
  browserNotificationsEnabled: false,
  notifyOnDueToday: true,
  emailDigestEnabled: false,
};

export const storageService = {
  // Subscriptions
  getSubscriptions(): Subscription[] {
    try {
      const data = localStorage.getItem(SUBS_STORAGE_KEY);
      if (!data) {
        // Initialize with realistic sample demo data
        this.saveSubscriptions(INITIAL_SUBSCRIPTIONS);
        return INITIAL_SUBSCRIPTIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load subscriptions from localStorage:', e);
      return INITIAL_SUBSCRIPTIONS;
    }
  },

  saveSubscriptions(subscriptions: Subscription[]): void {
    try {
      localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Failed to save subscriptions:', e);
    }
  },

  // History
  getHistory(): RenewalHistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!data) {
        this.saveHistory(INITIAL_HISTORY);
        return INITIAL_HISTORY;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load history from localStorage:', e);
      return INITIAL_HISTORY;
    }
  },

  saveHistory(history: RenewalHistoryItem[]): void {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },

  // Settings
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // Demo Data Reset
  resetDemoData(): { subscriptions: Subscription[]; history: RenewalHistoryItem[] } {
    this.saveSubscriptions(INITIAL_SUBSCRIPTIONS);
    this.saveHistory(INITIAL_HISTORY);
    return {
      subscriptions: INITIAL_SUBSCRIPTIONS,
      history: INITIAL_HISTORY,
    };
  },

  // Remove all Demo Data, keep only custom records
  removeDemoData(currentSubs: Subscription[]): Subscription[] {
    const customOnly = currentSubs.filter((s) => !s.isDemo);
    this.saveSubscriptions(customOnly);
    return customOnly;
  },

  // Wipe everything
  clearAll(): void {
    localStorage.removeItem(SUBS_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  },
};
