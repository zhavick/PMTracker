import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import ThemeModal from './ThemeModal';
import SessionWarningModal from './SessionWarningModal';
import ActiveTimerBar from '../timesheet/ActiveTimerBar';
import OnboardingTour from '../common/OnboardingTour';
import ErrorBoundary from '../common/ErrorBoundary';
import { useSessionGuard } from '../../hooks/useSessionGuard';

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(() => {
    return localStorage.getItem('worktracker_tour_completed') !== 'true';
  });
  const navigate = useNavigate();

  // Inactivity guard hook (1 hour timeout / 55 min warning)
  const { showWarning, remainingSeconds, extendSession } = useSessionGuard();

  const handleQuickAdd = () => {
    navigate('/tasks?create=true');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Mobile Off-Canvas Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={() => setIsMobileDrawerOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 transition-colors">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Live Multi-Timer Floating Bar */}
        <ActiveTimerBar />

        {/* Mobile Glassmorphic Bottom Navigation */}
        <MobileBottomNav 
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {/* Theme & Font Selection Modal */}
      <ThemeModal 
        isOpen={isThemeModalOpen} 
        onClose={() => setIsThemeModalOpen(false)} 
      />

      {/* Session Inactivity Warning Modal */}
      <SessionWarningModal 
        isOpen={showWarning} 
        remainingSeconds={remainingSeconds} 
        onExtend={extendSession} 
      />

      {/* Onboarding Tour */}
      <OnboardingTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
      />
    </div>
  );
}
