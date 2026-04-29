import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { Button } from './UI';
import clsx from 'clsx';

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
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const canAccessItem = (roles) => {
    if (roles.includes('*')) return true;
    return roles.includes(user?.role);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg md:hidden"
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          'sidebar transition-all duration-300',
          !sidebarOpen && 'translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950">
              ⚔️
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-rajdhani font-bold text-amber-400">CONVOY</h1>
                <p className="text-xs text-slate-500">Command & Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          {navItems.map((item) => {
            if (!canAccessItem(item.roles)) return null;

            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'sidebar-item group mb-2',
                  isActive && 'active'
                )}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
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
            <div className="mb-4">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-100">{user?.name}</p>
              <p className="text-xs text-amber-400 capitalize">{user?.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={logout}
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

  return (
    <header className="scanner-header bg-slate-900 border-b border-slate-700 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-rajdhani text-amber-400">
            Fleet Operations
          </h2>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-400 cursor-pointer hover:text-amber-400" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            </div>
          )}

          <div className="text-right">
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
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className={clsx('flex-1 flex flex-col transition-all duration-300', sidebarOpen ? 'md:ml-0' : '')}>
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
