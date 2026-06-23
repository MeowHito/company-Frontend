import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { DashboardStats, ChartData, CATEGORIES, Event } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const statCards = [
  { key: 'today_count', label: 'วันนี้', icon: '📅', color: 'bg-blue-500' },
  { key: 'week_count', label: 'สัปดาห์นี้', icon: '📆', color: 'bg-green-500' },
  { key: 'month_count', label: 'เดือนนี้', icon: '🗓', color: 'bg-purple-500' },
  { key: 'total_count', label: 'ทั้งหมด', icon: '📊', color: 'bg-indigo-500' },
  { key: 'pending_count', label: 'ยังไม่เสร็จ', icon: '⏳', color: 'bg-yellow-500' },
  { key: 'urgent_count', label: 'งานด่วน', icon: '🔥', color: 'bg-red-500' },
  { key: 'in_progress_count', label: 'กำลังทำ', icon: '🔄', color: 'bg-orange-500' },
];

const statusMap: Record<string, { label: string; class: string }> = {
  in_progress: { label: 'กำลังทำ', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  completed: { label: 'เสร็จแล้ว', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  cancelled: { label: 'ยกเลิก', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, eventsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
          api.get('/events', { params: { limit: 10 } }),
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
        const events = Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data.events || [];
        setRecentEvents(events.slice(0, 10));
      } catch {
        setStats({ today_count: 0, week_count: 0, month_count: 0, total_count: 0, pending_count: 0, urgent_count: 0, in_progress_count: 0 });
        setCharts({ monthly_counts: [], category_counts: [], daily_hours: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const categoryColors = CATEGORIES.reduce((acc, c) => ({ ...acc, [c.name]: c.color }), {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white">แดชบอร์ด</h2>

      {/* Stat Cards - single row */}
      <div className="grid grid-cols-7 gap-2">
        {statCards.map((card) => (
          <div key={card.key} className="card p-3 flex items-center gap-2">
            <span className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0`}>
              {card.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold dark:text-white leading-tight">{stats ? (stats as any)[card.key] : 0}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">ตารางงานวันนี้</h3>
          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const todayEvents = recentEvents
                .filter(e => e.start_datetime.startsWith(today))
                .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
              if (todayEvents.length === 0) {
                return <p className="text-gray-400 text-center py-8">วันนี้ไม่มีกิจกรรม</p>;
              }
              return todayEvents.map((event) => {
                const catColor = CATEGORIES.find(c => c.name === event.category)?.color || event.color || '#888';
                const status = statusMap[event.status] || statusMap.in_progress;
                const startTime = format(parseISO(event.start_datetime), 'HH:mm');
                const endTime = format(parseISO(event.end_datetime), 'HH:mm');
                return (
                  <div key={event.id} className="flex items-stretch gap-3 group">
                    {/* Time */}
                    <div className="w-14 flex-shrink-0 text-right pt-2.5">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{startTime}</span>
                    </div>
                    {/* Timeline line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full border-2 mt-2.5 flex-shrink-0" style={{ borderColor: catColor, backgroundColor: event.status === 'completed' ? catColor : 'transparent' }} />
                      <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-3 pt-1">
                      <div className="rounded-lg p-3 border border-gray-100 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => navigate('/calendar/daily')}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm dark:text-white truncate">{event.title}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.class}`}>{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-400">{startTime} - {endTime}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: catColor + '18', color: catColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                            {event.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">สัดส่วนตามหมวดหมู่</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts?.category_distribution || charts?.category_counts || []}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {(charts?.category_distribution || charts?.category_counts || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color || categoryColors[entry.category] || '#888'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Events Table */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">กิจกรรมล่าสุด</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">กิจกรรม</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">เวลา</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">หมวด</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">สถานะ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">ไม่มีกิจกรรม</td>
                  </tr>
                ) : (
                  recentEvents.map((event) => {
                    const catColor = CATEGORIES.find(c => c.name === event.category)?.color || event.color || '#888';
                    const status = statusMap[event.status] || statusMap.in_progress;
                    return (
                      <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="py-3 px-4 dark:text-white font-medium">{event.title}</td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {format(parseISO(event.start_datetime), 'd MMM', { locale: th })}{' '}
                          <span className="text-gray-400">{format(parseISO(event.start_datetime), 'HH:mm')}-{format(parseISO(event.end_datetime), 'HH:mm')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: catColor + '20', color: catColor }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                            {event.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.class}`}>{status.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate('/calendar/daily')}
                            className="text-primary-500 hover:text-primary-700 text-xs font-medium hover:underline"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
