import React, { useRef, useEffect, useState, useCallback } from 'react';
import { format, addDays, subDays, startOfDay, isSameDay, parseISO, differenceInMinutes } from 'date-fns';
import { th } from 'date-fns/locale';
import { Event } from '../../types';

interface DailyViewProps {
  currentDate: Date;
  events: Event[];
  onCellClick: (date: Date, hour: number) => void;
  onEventClick: (event: Event) => void;
  onVisibleDatesChange?: (dates: Date[]) => void;
}

const TIME_SLOTS: { hour: number; minute: number; label: string }[] = [];
for (let h = 8; h <= 18; h++) {
  TIME_SLOTS.push({ hour: h, minute: 0, label: `${String(h).padStart(2, '0')}:00` });
  if (h < 18) TIME_SLOTS.push({ hour: h, minute: 30, label: `${String(h).padStart(2, '0')}:30` });
}
const CELL_WIDTH = 60;
const CELL_HEIGHT = 60;
const LABEL_WIDTH = 100;
const HEADER_HEIGHT = 40;
const WINDOW_START_MIN = 8 * 60; // 08:00 — first visible time slot
const WINDOW_END_MIN = WINDOW_START_MIN + TIME_SLOTS.length * 30; // end of last visible slot
const BUFFER_DAYS_BEFORE = 7;
const INITIAL_DAYS = 21;
const LOAD_BATCH = 7;

const DailyView: React.FC<DailyViewProps> = ({ currentDate, events, onCellClick, onEventClick, onVisibleDatesChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const daysRef = useRef<Date[]>([]);
  const loadingRef = useRef(false);

  const [days, setDays] = useState<Date[]>(() => {
    const start = subDays(startOfDay(currentDate), BUFFER_DAYS_BEFORE);
    return Array.from({ length: INITIAL_DAYS }, (_, i) => addDays(start, i));
  });

  daysRef.current = days;

  useEffect(() => {
    const start = subDays(startOfDay(currentDate), BUFFER_DAYS_BEFORE);
    const newDays = Array.from({ length: INITIAL_DAYS }, (_, i) => addDays(start, i));
    setDays(newDays);
    loadingRef.current = false;

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = BUFFER_DAYS_BEFORE * CELL_HEIGHT;
        const ch = now.getHours();
        scrollRef.current.scrollLeft = Math.max(0, (ch - 8) * 2 * CELL_WIDTH - 200);
      }
    });
  }, [currentDate]);

  const emitVisible = useCallback(() => {
    if (!scrollRef.current || !onVisibleDatesChange) return;
    const st = scrollRef.current.scrollTop;
    const vh = scrollRef.current.clientHeight;
    const first = Math.floor(Math.max(0, st - HEADER_HEIGHT) / CELL_HEIGHT);
    const last = Math.ceil(Math.max(0, st - HEADER_HEIGHT + vh) / CELL_HEIGHT);
    const visible = daysRef.current.slice(first, Math.min(daysRef.current.length, last));
    if (visible.length > 0) onVisibleDatesChange(visible);
  }, [onVisibleDatesChange]);

  useEffect(() => {
    emitVisible();
  }, [days, emitVisible]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingRef.current) return;

    emitVisible();

    const scrollTop = el.scrollTop;
    const scrollBottom = el.scrollHeight - el.clientHeight - scrollTop;

    if (scrollTop < CELL_HEIGHT * 2) {
      loadingRef.current = true;
      const first = daysRef.current[0];
      const prepend = Array.from({ length: LOAD_BATCH }, (_, i) => subDays(first, LOAD_BATCH - i));

      setDays(prev => [...prepend, ...prev]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop += LOAD_BATCH * CELL_HEIGHT;
          }
          loadingRef.current = false;
        });
      });
    } else if (scrollBottom < CELL_HEIGHT * 2) {
      loadingRef.current = true;
      const last = daysRef.current[daysRef.current.length - 1];
      const append = Array.from({ length: LOAD_BATCH }, (_, i) => addDays(last, i + 1));

      setDays(prev => [...prev, ...append]);

      requestAnimationFrame(() => {
        loadingRef.current = false;
      });
    }
  }, [emitVisible]);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => {
      const start = parseISO(e.start_datetime);
      const end = parseISO(e.end_datetime);
      return isSameDay(start, day) || isSameDay(end, day) || (start < day && end > day);
    });

  const getEventStyle = (event: Event, day: Date) => {
    const start = parseISO(event.start_datetime);
    const end = parseISO(event.end_datetime);
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);

    const effectiveStart = start < dayStart ? dayStart : start;
    const effectiveEnd = end > dayEnd ? dayEnd : end;

    let startMinutes = differenceInMinutes(effectiveStart, dayStart);
    let endMinutes = differenceInMinutes(effectiveEnd, dayStart);

    // Clamp to the visible time window (08:00 - 18:30) so multi-day events
    // don't overflow across the whole row.
    startMinutes = Math.max(startMinutes, WINDOW_START_MIN);
    endMinutes = Math.min(endMinutes, WINDOW_END_MIN);

    // Event does not overlap the visible window on this day.
    if (endMinutes <= startMinutes) return null;

    const left = LABEL_WIDTH + ((startMinutes - WINDOW_START_MIN) / 30) * CELL_WIDTH;
    const width = Math.max(((endMinutes - startMinutes) / 30) * CELL_WIDTH, 20);

    // Whether this segment is a continuation from the previous/next day.
    const continuesBefore = start < effectiveStart || startMinutes > differenceInMinutes(effectiveStart, dayStart);
    const continuesAfter = end > effectiveEnd || endMinutes < differenceInMinutes(effectiveEnd, dayStart);

    return { left, width, continuesBefore, continuesAfter };
  };

  return (
    <div className="card overflow-hidden">
      <div ref={scrollRef} onScroll={handleScroll} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        <div style={{ minWidth: LABEL_WIDTH + TIME_SLOTS.length * CELL_WIDTH }}>
          {/* Time Slot Headers */}
          <div className="flex sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div
              className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-xs font-semibold text-gray-500"
              style={{ width: LABEL_WIDTH, height: HEADER_HEIGHT }}
            >
              เวลา / วัน
            </div>
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.label}
                className={`flex-shrink-0 border-r border-gray-100 dark:border-gray-700 flex items-center justify-center text-xs dark:text-gray-400 bg-gray-50 dark:bg-gray-900 ${
                  slot.minute === 0 ? 'text-gray-600 font-medium' : 'text-gray-400'
                }`}
                style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
              >
                {slot.label}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isSameDay(day, now);

            return (
              <div key={day.toISOString()} className="flex relative" style={{ height: CELL_HEIGHT }}>
                {/* Day label */}
                <div
                  className={`flex-shrink-0 border-r border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center sticky left-0 z-10 ${
                    isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                  style={{ width: LABEL_WIDTH }}
                >
                  <span className="text-xs text-gray-400">{format(day, 'EEE', { locale: th })}</span>
                  <span className={`text-sm font-semibold ${isCurrentDay ? 'text-primary-500' : 'dark:text-white'}`}>
                    {format(day, 'd MMM', { locale: th })}
                  </span>
                </div>

                {/* Time slot cells */}
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.label}
                    onClick={() => onCellClick(day, slot.hour)}
                    className={`flex-shrink-0 border-b cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${
                      slot.minute === 0 ? 'border-r border-gray-200 dark:border-gray-600' : 'border-r border-gray-100 dark:border-gray-700 border-dashed'
                    } ${isCurrentDay ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                    style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                  />
                ))}

                {/* Events overlay */}
                {dayEvents.map((event) => {
                  const style = getEventStyle(event, day);
                  if (!style) return null;
                  const { left, width, continuesBefore, continuesAfter } = style;
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className="absolute top-1 px-1.5 py-0.5 text-xs text-white cursor-pointer hover:opacity-90 shadow-sm overflow-hidden whitespace-nowrap z-10"
                      style={{
                        left,
                        width,
                        height: CELL_HEIGHT - 8,
                        backgroundColor: event.color || '#4285F4',
                        borderTopLeftRadius: continuesBefore ? 0 : 6,
                        borderBottomLeftRadius: continuesBefore ? 0 : 6,
                        borderTopRightRadius: continuesAfter ? 0 : 6,
                        borderBottomRightRadius: continuesAfter ? 0 : 6,
                      }}
                      title={`${event.title} (${format(parseISO(event.start_datetime), 'd MMM HH:mm')} - ${format(parseISO(event.end_datetime), 'd MMM HH:mm')})`}
                    >
                      <div className="font-medium truncate">
                        {continuesBefore && '◀ '}{event.title}{continuesAfter && ' ▶'}
                      </div>
                      <div className="text-[10px] opacity-80 truncate">
                        {format(parseISO(event.start_datetime), 'HH:mm')}-{format(parseISO(event.end_datetime), 'HH:mm')}
                      </div>
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isCurrentDay && (
                  <div
                    className="absolute top-0 w-0.5 bg-red-500 z-20"
                    style={{
                      left: LABEL_WIDTH + ((now.getHours() * 60 + now.getMinutes() - 480) / 30) * CELL_WIDTH,
                      height: CELL_HEIGHT,
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyView;
