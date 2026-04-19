import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard, Briefcase, FileText, Settings, Menu, X,
  ChevronRight, Building2, BarChart2, Users, LogOut,
} from 'lucide-react';
import { usersApi } from '../lib/api.js';
import ReferralOnboardingModal from './ReferralOnboardingModal.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/deals', label: 'My Deals', icon: Briefcase },
  { to: '/documents', label: 'Saved Documents', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/referrals', label: 'Referral Network', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function UserInitials({ name }) {
  const initials = (name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Check if user needs the referral onboarding modal
    usersApi.me().then(({ user: u }) => {
      if (!u.hasSeenReferralModal) {
        setShowReferralModal(true);
      }
    }).catch(() => {});
  }, [user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch {
      setSigningOut(false);
    }
  };

  const handleReferralModalClose = () => {
    setShowReferralModal(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-charcoal-900/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-charcoal-900 text-white
          flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-charcoal-700">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="font-serif text-xl tracking-tight">CRE Suite</span>
          <button
            className="ml-auto lg:hidden text-charcoal-600 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-accent text-white'
                  : 'text-charcoal-600/80 hover:bg-charcoal-800 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40 group-hover:opacity-70" />
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-charcoal-700">
          <div className="flex items-center gap-3 mb-3">
            <UserInitials name={user?.fullName} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-charcoal-600/70 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-charcoal-600/70 hover:bg-charcoal-800 hover:text-red-400 transition-all duration-150"
          >
            <LogOut size={15} />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-cream-200 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-charcoal-700 hover:text-accent p-1"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-accent" />
            <span className="font-serif text-lg">CRE Suite</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Referral Onboarding Modal */}
      {showReferralModal && (
        <ReferralOnboardingModal onClose={handleReferralModalClose} />
      )}
    </div>
  );
}
