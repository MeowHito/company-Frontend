import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CATEGORIES } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { th } from 'date-fns/locale';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  visibleDates?: Date[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, darkMode, onToggleDarkMode, visibleDates = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [miniCalDate, setMiniCalDate] = useState(new Date());

  React.useEffect(() => {
    if (visibleDates.length > 0) {
      const midDate = visibleDates[Math.floor(visibleDates.length / 2)];
      if (!isSameMonth(midDate, miniCalDate)) {
        setMiniCalDate(midDate);
      }
    }
  }, [visibleDates]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const monthStart = startOfMonth(miniCalDate);
  const monthEnd = endOfMonth(miniCalDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
    }`;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-200 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-primary-500 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Secretary Work Log
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            แดชบอร์ด
          </NavLink>

          <div className="pt-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">ปฏิทิน</p>
            <NavLink to="/calendar/daily" className={navLinkClass} onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              รายวัน
            </NavLink>
            <NavLink to="/calendar/monthly" className={navLinkClass} onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              รายเดือน
            </NavLink>
            <NavLink to="/calendar/yearly" className={navLinkClass} onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              รายปี
            </NavLink>
          </div>

          {/* Category Legend */}
          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">หมวดหมู่</p>
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </div>
            ))}
          </div>

          {/* Mini Calendar */}
          <div className="pt-4 px-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <button onClick={() => setMiniCalDate(subMonths(miniCalDate, 1))} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {format(miniCalDate, 'MMMM yyyy', { locale: th })}
              </p>
              <button onClick={() => setMiniCalDate(addMonths(miniCalDate, 1))} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 text-center text-xs">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                <div key={d} className="py-1 text-gray-400 font-medium">{d}</div>
              ))}
              {calDays.map((day) => {
                const isVisible = visibleDates.some(vd => isSameDay(vd, day));
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`py-1 rounded-full cursor-pointer transition-colors ${
                      !isSameMonth(day, miniCalDate) ? 'text-gray-300 dark:text-gray-600' : ''
                    } ${today ? 'bg-primary-500 text-white hover:bg-primary-600' : ''
                    } ${isVisible && !today ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 font-semibold' : ''
                    } ${!isVisible && !today ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Dark mode toggle + User */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            {darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}
          </button>

          {user && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="ออกจากระบบ">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
