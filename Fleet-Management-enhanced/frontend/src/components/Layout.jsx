import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  BarChart3,
  Users,
  Truck,
  AlertCircle,
  MessageSquare,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuthStore, useUIStore, useAlertStore } from '../store';
import { authService } from '../services/api';
import { socketService } from '../services/socket';
import { Button } from './UI';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const navItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard', roles: ['*'] },
  { icon: Truck, label: 'Fleet', path: '/fleet', roles: ['*'] },
  { icon: Users, label: 'Convoys', path: '/convoys', roles: ['*'] },
  { icon: AlertCircle, label: 'Alerts', path: '/alerts', roles: ['*'] },
  { icon: MessageSquare, label: 'Messages', path: '/messages', roles: ['*'] },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['admin', 'dispatcher'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
];

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname, setSidebarOpen]);

  const canAccessItem = (roles) => {
    if (roles.includes('*')) return true;
    return roles.includes(user?.role);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (_) {
      // ignore logout errors — always clear local state
    } finally {
      socketService.disconnect();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg md:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          'sidebar fixed top-0 left-0 h-full z-40 flex flex-col bg-slate-900 border-r border-slate-700 w-64 transition-transform duration-300',
          !sidebarOpen && '-translate-x-full md:translate-x-0 md:w-16'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 flex-shrink-0">
              ⚔
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-rajdhani font-bold text-amber-400">CONVOY</h1>
                <p className="text-xs text-slate-500">Command &amp; Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!canAccessItem(item.roles)) return null;
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="flex-1 text-sm font-medium">{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-3">
          {sidebarOpen && (
            <div className="mb-3 px-1">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-amber-400 capitalize">{user?.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </div>
    </>
  );
};

export const Header = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useAlertStore();
  const navigate = useNavigate();

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="pl-10 md:pl-0">
          <h2 className="text-xl font-bold font-rajdhani text-amber-400">Fleet Operations</h2>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Bell icon always visible — show badge only if unread */}
          <button
            className="relative p-1 rounded hover:bg-slate-800 transition-colors"
            onClick={() => navigate('/alerts')}
            aria-label={`${unreadCount} unread alerts`}
          >
            <Bell className="w-5 h-5 text-slate-400 hover:text-amber-400 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Layout = ({ children }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      {/* FIXED: content area shifts correctly based on sidebar state */}
      <div
        className={clsx(
          'flex-1 flex flex-col transition-all duration-300 min-w-0',
          sidebarOpen ? 'md:ml-64' : 'md:ml-16'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
