/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PageId, Subscription } from './types';
import { SubscriptionProvider, useSubscriptions } from './context/SubscriptionContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ActionConfirmModal, ActionType } from './components/ActionConfirmModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { UpcomingRenewalsPage } from './pages/UpcomingRenewalsPage';
import { SpendingInsightsPage } from './pages/SpendingInsightsPage';
import { RenewalHistoryPage } from './pages/RenewalHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { subscriptions, renewSubscription, cancelSubscription, skipSubscription, deleteSubscription } =
    useSubscriptions();

  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Subscription Add / Edit Modal
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);

  // Action Confirm Modal (Renew, Cancel, Skip, Delete)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    actionType: ActionType;
    subscription: Subscription | null;
  }>({
    isOpen: false,
    actionType: 'renew',
    subscription: null,
  });

  // Modal Triggers
  const handleOpenAddModal = () => {
    setSubscriptionToEdit(null);
    setIsSubscriptionModalOpen(true);
  };

  const handleEditClick = (sub: Subscription) => {
    setSubscriptionToEdit(sub);
    setIsSubscriptionModalOpen(true);
  };

  const handleRenewClick = (sub: Subscription) => {
    setActionModal({
      isOpen: true,
      actionType: 'renew',
      subscription: sub,
    });
  };

  const handleCancelClick = (sub: Subscription) => {
    setActionModal({
      isOpen: true,
      actionType: 'cancel',
      subscription: sub,
    });
  };

  const handleSkipClick = (sub: Subscription) => {
    setActionModal({
      isOpen: true,
      actionType: 'skip',
      subscription: sub,
    });
  };

  const handleDeleteClick = (sub: Subscription) => {
    setActionModal({
      isOpen: true,
      actionType: 'delete',
      subscription: sub,
    });
  };

  const handleQuickRenew = (subId: string) => {
    const found = subscriptions.find((s) => s.id === subId);
    if (found) {
      handleRenewClick(found);
    }
  };

  const handleConfirmAction = (notes?: string) => {
    if (!actionModal.subscription) return;
    const { id } = actionModal.subscription;

    switch (actionModal.actionType) {
      case 'renew':
        renewSubscription(id, notes);
        break;
      case 'cancel':
        cancelSubscription(id, notes);
        break;
      case 'skip':
        skipSubscription(id, notes);
        break;
      case 'delete':
        deleteSubscription(id);
        break;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenAddModal={handleOpenAddModal}
          onQuickRenew={handleQuickRenew}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <DashboardPage
                onNavigate={setCurrentPage}
                onOpenAddModal={handleOpenAddModal}
                onRenewClick={handleRenewClick}
                onSkipClick={handleSkipClick}
              />
            )}

            {currentPage === 'subscriptions' && (
              <SubscriptionsPage
                onOpenAddModal={handleOpenAddModal}
                onEditClick={handleEditClick}
                onRenewClick={handleRenewClick}
                onCancelClick={handleCancelClick}
                onSkipClick={handleSkipClick}
                onDeleteClick={handleDeleteClick}
              />
            )}

            {currentPage === 'renewals' && (
              <UpcomingRenewalsPage
                onOpenAddModal={handleOpenAddModal}
                onRenewClick={handleRenewClick}
                onSkipClick={handleSkipClick}
                onCancelClick={handleCancelClick}
              />
            )}

            {currentPage === 'insights' && (
              <SpendingInsightsPage onCancelClick={handleCancelClick} />
            )}

            {currentPage === 'history' && <RenewalHistoryPage />}

            {currentPage === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Subscription Create / Edit Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscriptionToEdit={subscriptionToEdit}
      />

      {/* Action Confirm Modal (Renew, Cancel, Skip, Delete) */}
      <ActionConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        subscription={actionModal.subscription}
        actionType={actionModal.actionType}
        onConfirm={handleConfirmAction}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <SubscriptionProvider>
      <AppContent />
    </SubscriptionProvider>
  );
}
