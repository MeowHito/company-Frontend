import React, { useState, useMemo } from 'react';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Event, CATEGORIES } from '../../types';

const MONTH_NAMES_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

interface YearlyViewProps {
  currentDate: Date;
  events: Event[];
  onCellClick: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i);

const YearlyView: React.FC<YearlyViewProps> = ({ currentDate, events, onCellClick, onNavigate }) => {
  const [mode, setMode] = useState<'heatmap' | 'summary'>('heatmap');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{ month: number; day: number } | null>(null);

  const year = currentDate.getFullYear();

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const eventMap = useMemo(() => {
    const map: Record<string, Event[]> = {};
    filteredEvents.forEach((e) => {
      const key = format(parseISO(e.start_datetime), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [filteredEvents]);

  const getColor = (count: number) => {
    if (count === 0) return '';
    if (count === 1) return 'bg-blue-200 dark:bg-blue-900';
    if (count === 2) return 'bg-blue-300 dark:bg-blue-800';
    if (count === 3) return 'bg-blue-400 dark:bg-blue-700';
    return 'bg-blue-500 dark:bg-blue-600';
  };

  const getCellEvents = (month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventMap[dateStr] || [];
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('prev')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold dark:text-white">ปี {year + 543}</h3>
          <button onClick={() => onNavigate('next')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setMode('heatmap')}
              className={`px-3 py-1 text-xs rounded-md ${mode === 'heatmap' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-500' : 'text-gray-500'}`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setMode('summary')}
              className={`px-3 py-1 text-xs rounded-md ${mode === 'summary' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-500' : 'text-gray-500'}`}
            >
              สรุป
            </button>
          </div>
        </div>
      </div>

      {mode === 'heatmap' ? (
        <div className="overflow-auto p-4">
          {/* Day headers */}
          <div className="flex mb-1">
            <div className="w-20 flex-shrink-0" />
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="w-7 flex-shrink-0 text-center text-[10px] text-gray-400">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Month rows */}
          {MONTHS.map((m) => {
            const daysInMonth = getDaysInMonth(new Date(year, m));
            return (
              <div key={m} className="flex items-center mb-0.5">
                <div className="w-20 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-medium pr-2 text-right">
                  {format(new Date(year, m), 'MMMM', { locale: th })}
                </div>
                {Array.from({ length: 31 }, (_, d) => {
                  const day = d + 1;
                  if (day > daysInMonth) {
                    return <div key={d} className="w-7 h-7 flex-shrink-0" />;
                  }
                  const cellEvents = getCellEvents(m, day);
                  const isHovered = hoveredCell?.month === m && hoveredCell?.day === day;

                  return (
                    <div
                      key={d}
                      className={`w-7 h-7 flex-shrink-0 rounded-sm cursor-pointer border transition-all flex items-center justify-center text-[9px] ${
                        cellEvents.length > 0
                          ? `${getColor(cellEvents.length)} text-white border-transparent`
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-300'
                      } ${isHovered ? 'ring-2 ring-primary-500' : ''}`}
                      onClick={() => onCellClick(new Date(year, m, day))}
                      onMouseEnter={() => setHoveredCell({ month: m, day })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={cellEvents.length > 0 ? `${cellEvents.length} กิจกรรม` : ''}
                    >
                      {cellEvents.length > 0 ? cellEvents.length : ''}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
            <span>น้อย</span>
            <div className="w-4 h-4 rounded-sm bg-gray-50 dark:bg-gray-800 border border-gray-200" />
            <div className="w-4 h-4 rounded-sm bg-blue-200 dark:bg-blue-900" />
            <div className="w-4 h-4 rounded-sm bg-blue-300 dark:bg-blue-800" />
            <div className="w-4 h-4 rounded-sm bg-blue-400 dark:bg-blue-700" />
            <div className="w-4 h-4 rounded-sm bg-blue-500 dark:bg-blue-600" />
            <span>มาก</span>
          </div>

          {/* Monthly Summary Table + Category Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Monthly summary table */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">สรุปรายเดือน</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 font-semibold text-gray-500">เดือน</th>
                      {CATEGORIES.map(c => (
                        <th key={c.name} className="text-center py-2 px-1 font-semibold" style={{ color: c.color }}>
                          <span className="inline-block w-2 h-2 rounded-full mr-0.5" style={{ backgroundColor: c.color }} />
                          {c.name.length > 6 ? c.name.slice(0, 6) + '.' : c.name}
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-gray-700 dark:text-gray-300">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map(m => {
                      const monthEvts = filteredEvents.filter(e => {
                        const d = parseISO(e.start_datetime);
                        return d.getFullYear() === year && d.getMonth() === m;
                      });
                      const total = monthEvts.length;
                      return (
                        <tr key={m} className={`border-b border-gray-100 dark:border-gray-800 ${total > 0 ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}>
                          <td className="py-1.5 px-2 font-medium text-gray-600 dark:text-gray-400">{MONTH_NAMES_SHORT[m]}</td>
                          {CATEGORIES.map(c => {
                            const cnt = monthEvts.filter(e => e.category === c.name).length;
                            return (
                              <td key={c.name} className="text-center py-1.5 px-1">
                                {cnt > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-5 rounded text-white text-[10px] font-bold" style={{ backgroundColor: c.color }}>
                                    {cnt}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-700">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="text-center py-1.5 px-2 font-bold text-gray-700 dark:text-gray-300">
                            {total > 0 ? total : <span className="text-gray-300 dark:text-gray-700">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <td className="py-2 px-2 font-bold text-gray-700 dark:text-gray-300">ทั้งปี</td>
                      {CATEGORIES.map(c => {
                        const cnt = filteredEvents.filter(e => e.category === c.name && parseISO(e.start_datetime).getFullYear() === year).length;
                        return (
                          <td key={c.name} className="text-center py-2 px-1 font-bold" style={{ color: c.color }}>
                            {cnt > 0 ? cnt : '-'}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 px-2 font-bold text-primary-500 text-sm">
                        {filteredEvents.filter(e => parseISO(e.start_datetime).getFullYear() === year).length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category bar chart */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">สัดส่วนหมวดหมู่ทั้งปี</h4>
              <div className="space-y-2.5">
                {(() => {
                  const yearEvents = events.filter(e => parseISO(e.start_datetime).getFullYear() === year);
                  const maxCount = Math.max(1, ...CATEGORIES.map(c => yearEvents.filter(e => e.category === c.name).length));
                  return CATEGORIES.map(c => {
                    const cnt = yearEvents.filter(e => e.category === c.name).length;
                    const pct = (cnt / maxCount) * 100;
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                          <span className="text-xs font-bold" style={{ color: c.color }}>{cnt}</span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: c.color }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(() => {
                  const yearEvents = events.filter(e => parseISO(e.start_datetime).getFullYear() === year);
                  const completed = yearEvents.filter(e => e.status === 'completed').length;
                  const inProgress = yearEvents.filter(e => e.status === 'in_progress').length;
                  const urgent = yearEvents.filter(e => e.priority === 'urgent').length;
                  const busiest = MONTHS.reduce((best, m) => {
                    const cnt = yearEvents.filter(e => parseISO(e.start_datetime).getMonth() === m).length;
                    return cnt > best.count ? { month: m, count: cnt } : best;
                  }, { month: 0, count: 0 });
                  return (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{completed}</p>
                        <p className="text-[10px] text-green-500">เสร็จแล้ว</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{inProgress}</p>
                        <p className="text-[10px] text-blue-500">กำลังทำ</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{urgent}</p>
                        <p className="text-[10px] text-red-500">งานด่วน</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{busiest.count > 0 ? MONTH_NAMES_SHORT[busiest.month] : '-'}</p>
                        <p className="text-[10px] text-purple-500">เดือนที่งานเยอะสุด</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Summary mode */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map((m) => {
            const monthEvents = filteredEvents.filter((e) => {
              const d = parseISO(e.start_datetime);
              return d.getFullYear() === year && d.getMonth() === m;
            });
            return (
              <div key={m} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 dark:text-white">
                  {format(new Date(year, m), 'MMMM', { locale: th })}
                </h4>
                <p className="text-2xl font-bold text-primary-500">{monthEvents.length}</p>
                <p className="text-xs text-gray-400">กิจกรรม</p>
                <div className="mt-2 space-y-1">
                  {CATEGORIES.map((cat) => {
                    const count = monthEvents.filter((e) => e.category === cat.name).length;
                    if (count === 0) return null;
                    return (
                      <div key={cat.name} className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-500 dark:text-gray-400">{cat.name}: {count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YearlyView;
