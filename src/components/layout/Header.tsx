import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ViewMode } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onToday?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, searchQuery, onSearchChange, viewMode, onViewModeChange, onToday }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCalendar = location.pathname.startsWith('/calendar');

  const viewButtons: { mode: ViewMode; label: string }[] = [
    { mode: 'daily', label: 'รายวัน' },
    { mode: 'monthly', label: 'รายเดือน' },
    { mode: 'yearly', label: 'รายปี' },
  ];

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 sticky top-0 z-30">
      <button onClick={onToggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="ค้นหากิจกรรม..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* View mode buttons */}
      {isCalendar && onViewModeChange && (
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {viewButtons.map((btn) => (
            <button
              key={btn.mode}
              onClick={() => {
                onViewModeChange(btn.mode);
                navigate(`/calendar/${btn.mode}`);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === btn.mode
                  ? 'bg-white dark:bg-gray-600 text-primary-500 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Today button */}
      {isCalendar && onToday && (
        <button onClick={onToday} className="hidden sm:block px-3 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300">
          วันนี้
        </button>
      )}

      {/* Notification bell */}
      <button className="relative text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      {/* User avatar */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium dark:text-white">{user.name}</span>
        </div>
      )}
    </header>
  );
};

export default Header;
