import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { th } from 'date-fns/locale';
import { Event } from '../../types';

interface MonthlyViewProps {
  currentDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onVisibleDatesChange?: (dates: Date[]) => void;
}

const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const MAX_VISIBLE = 3;
const INITIAL_MONTHS = 3;
const LOAD_BATCH = 1;

interface MonthData {
  month: Date;
  days: Date[];
}

function buildMonth(date: Date): MonthData {
  const ms = startOfMonth(date);
  const me = endOfMonth(date);
  const cs = startOfWeek(ms, { weekStartsOn: 0 });
  const ce = endOfWeek(me, { weekStartsOn: 0 });
  return { month: ms, days: eachDayOfInterval({ start: cs, end: ce }) };
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ currentDate, events, onDayClick, onEventClick, onNavigate, onVisibleDatesChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const [months, setMonths] = useState<MonthData[]>(() => {
    return Array.from({ length: INITIAL_MONTHS }, (_, i) =>
      buildMonth(addMonths(startOfMonth(currentDate), i - 1))
    );
  });

  const monthsRef = useRef(months);
  monthsRef.current = months;

  useEffect(() => {
    const newMonths = Array.from({ length: INITIAL_MONTHS }, (_, i) =>
      buildMonth(addMonths(startOfMonth(currentDate), i - 1))
    );
    setMonths(newMonths);
    loadingRef.current = false;

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const firstMonthBlock = scrollRef.current.querySelector('[data-month-index="1"]') as HTMLElement;
        if (firstMonthBlock) {
          scrollRef.current.scrollTop = firstMonthBlock.offsetTop - scrollRef.current.offsetTop;
        }
      }
    });
  }, [currentDate]);

  const emitVisible = useCallback(() => {
    if (!scrollRef.current || !onVisibleDatesChange) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const monthEls = scrollRef.current.querySelectorAll('[data-month-date]');
    for (const el of monthEls) {
      const r = el.getBoundingClientRect();
      if (r.top <= midY && r.bottom >= midY) {
        const monthDate = new Date((el as HTMLElement).dataset.monthDate!);
        const ms = startOfMonth(monthDate);
        const me = endOfMonth(monthDate);
        onVisibleDatesChange(eachDayOfInterval({ start: ms, end: me }));
        break;
      }
    }
  }, [onVisibleDatesChange]);

  useEffect(() => {
    emitVisible();
  }, [months, emitVisible]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingRef.current) return;

    emitVisible();

    if (el.scrollTop < 200) {
      loadingRef.current = true;
      const firstMonth = monthsRef.current[0].month;
      const prepend = Array.from({ length: LOAD_BATCH }, (_, i) =>
        buildMonth(subMonths(firstMonth, LOAD_BATCH - i))
      );
      const prevHeight = el.scrollHeight;
      setMonths(prev => [...prepend, ...prev]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop += scrollRef.current.scrollHeight - prevHeight;
          }
          loadingRef.current = false;
        });
      });
    }

    const scrollBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    if (scrollBottom < 200) {
      loadingRef.current = true;
      const lastMonth = monthsRef.current[monthsRef.current.length - 1].month;
      const append = Array.from({ length: LOAD_BATCH }, (_, i) =>
        buildMonth(addMonths(lastMonth, i + 1))
      );
      setMonths(prev => [...prev, ...append]);
      requestAnimationFrame(() => {
        loadingRef.current = false;
      });
    }
  }, [emitVisible]);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.start_datetime), day));

  return (
    <div className="card overflow-hidden">
      <div ref={scrollRef} onScroll={handleScroll} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {months.map((md, idx) => (
          <div key={md.month.toISOString()} data-month-index={idx} data-month-date={md.month.toISOString()}>
            {/* Month Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button onClick={() => onNavigate('prev')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold dark:text-white">
                {format(md.month, 'MMMM yyyy', { locale: th })}
              </h3>
              <button onClick={() => onNavigate('next')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {md.days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, md.month);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => onDayClick(day)}
                    className={`min-h-[100px] md:min-h-[120px] border-b border-r border-gray-100 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      !inMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
                    }`}
                  >
                    <div className="flex justify-end">
                      <span
                        className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                          today
                            ? 'bg-primary-500 text-white font-bold'
                            : inMonth
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, MAX_VISIBLE).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className="text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: event.color || '#4285F4' }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > MAX_VISIBLE && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 pl-1 font-medium">
                          +{dayEvents.length - MAX_VISIBLE} เพิ่มเติม
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyView;
