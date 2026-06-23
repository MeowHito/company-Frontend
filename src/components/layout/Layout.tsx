import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ViewMode } from '../../types';

interface LayoutProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onToday: () => void;
}

const Layout: React.FC<LayoutProps> = ({ searchQuery, onSearchChange, viewMode, onViewModeChange, currentDate, onToday }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        visibleDates={visibleDates}
      />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onToday={onToday}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet context={{ searchQuery, viewMode, onViewModeChange, currentDate, onToday, setVisibleDates }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
