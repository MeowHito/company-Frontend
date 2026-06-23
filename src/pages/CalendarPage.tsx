import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { addDays, addMonths, addYears, startOfMonth, startOfYear, endOfMonth, endOfYear, format, subDays, subMonths, subYears } from 'date-fns';
import { useEvents } from '../hooks/useEvents';
import { Event, EventFormData, CATEGORIES, ViewMode } from '../types';
import DailyView from '../components/calendar/DailyView';
import MonthlyView from '../components/calendar/MonthlyView';
import YearlyView from '../components/calendar/YearlyView';
import EventModal from '../components/calendar/EventModal';

interface OutletCtx {
  searchQuery: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onToday: () => void;
  setVisibleDates?: (dates: Date[]) => void;
}

const CalendarPage: React.FC = () => {
  const { viewMode: urlView } = useParams<{ viewMode: string }>();
  const ctx = useOutletContext<OutletCtx>();
  const { searchQuery, currentDate, onToday, setVisibleDates: setParentVisibleDates } = ctx;

  const viewMode = (urlView as ViewMode) || ctx.viewMode || 'monthly';

  const { events, fetchEvents, createEvent, updateEvent, deleteEvent } = useEvents();

  const [localDate, setLocalDate] = useState(currentDate);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const handleVisibleDatesChange = useCallback((dates: Date[]) => {
    if (setParentVisibleDates) setParentVisibleDates(dates);
  }, [setParentVisibleDates]);

  useEffect(() => {
    setLocalDate(currentDate);
  }, [currentDate]);

  const loadEvents = useCallback(() => {
    let start: string, end: string;
    if (viewMode === 'daily') {
      start = format(subDays(localDate, 14), 'yyyy-MM-dd');
      end = format(addDays(localDate, 30), 'yyyy-MM-dd');
    } else if (viewMode === 'monthly') {
      start = format(startOfMonth(addMonths(localDate, -1)), 'yyyy-MM-dd');
      end = format(endOfMonth(addMonths(localDate, 2)), 'yyyy-MM-dd');
    } else {
      start = format(startOfYear(localDate), 'yyyy-MM-dd');
      end = format(endOfYear(localDate), 'yyyy-MM-dd');
    }
    fetchEvents({ start_date: start, end_date: end, search: searchQuery || undefined, category: categoryFilter !== 'all' ? categoryFilter : undefined });
  }, [localDate, viewMode, searchQuery, categoryFilter, fetchEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const navigate = (dir: 'prev' | 'next') => {
    const fn = dir === 'prev'
      ? viewMode === 'daily' ? (d: Date) => subDays(d, 7) : viewMode === 'monthly' ? (d: Date) => subMonths(d, 1) : (d: Date) => subYears(d, 1)
      : viewMode === 'daily' ? (d: Date) => addDays(d, 7) : viewMode === 'monthly' ? (d: Date) => addMonths(d, 1) : (d: Date) => addYears(d, 1);
    setLocalDate(fn(localDate));
  };

  const handleCellClick = (date: Date, hour?: number) => {
    setSelectedEvent(null);
    setDefaultDate(date);
    setDefaultHour(hour);
    setModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDefaultDate(undefined);
    setDefaultHour(undefined);
    setModalOpen(true);
  };

  const handleSave = async (data: EventFormData) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, data);
    } else {
      await createEvent(data);
    }
    loadEvents();
  };

  const handleDelete = async (id: number) => {
    await deleteEvent(id);
    loadEvents();
  };

  return (
    <div className="space-y-4 relative">
      {/* Controls */}
      {viewMode !== 'yearly' && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('prev')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => setLocalDate(new Date())} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
              วันนี้
            </button>
            <button onClick={() => navigate('next')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 sticky top-0 right-0 z-30">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-white shadow-sm"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <button onClick={() => handleCellClick(new Date())} className="btn-primary text-sm flex items-center gap-1 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มกิจกรรม
            </button>
          </div>
        </div>
      )}

      {/* View */}
      {viewMode === 'daily' && (
        <DailyView
          currentDate={localDate}
          events={events}
          onCellClick={handleCellClick}
          onEventClick={handleEventClick}
          onVisibleDatesChange={handleVisibleDatesChange}
        />
      )}
      {viewMode === 'monthly' && (
        <MonthlyView
          currentDate={localDate}
          events={events}
          onDayClick={(d) => handleCellClick(d)}
          onEventClick={handleEventClick}
          onNavigate={navigate}
          onVisibleDatesChange={handleVisibleDatesChange}
        />
      )}
      {viewMode === 'yearly' && (
        <YearlyView
          currentDate={localDate}
          events={events}
          onCellClick={(d) => handleCellClick(d)}
          onNavigate={navigate}
        />
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEvent(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        event={selectedEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
      />
    </div>
  );
};

export default CalendarPage;
