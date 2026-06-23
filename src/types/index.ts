export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'secretary' | 'viewer';
}

export interface Event {
  id: number;
  user_id: number;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  category: string;
  color: string;
  note: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'in_progress' | 'completed' | 'cancelled';
  attachment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  today_count: number;
  week_count: number;
  month_count: number;
  total_count: number;
  pending_count: number;
  urgent_count: number;
  in_progress_count: number;
}

export interface ChartData {
  monthly_counts?: { month: string; count: number }[];
  category_counts?: { category: string; count: number; color?: string }[];
  category_distribution?: { category: string; count: number; color?: string }[];
  daily_hours?: { date: string; hours: number }[];
}

export type ViewMode = 'daily' | 'monthly' | 'yearly';

export const CATEGORIES = [
  { name: 'ระบบถ่ายภาพ', color: '#FBBC04' },
  { name: 'ระบบสมัคร', color: '#34A853' },
  { name: 'ระบบจับเวลา', color: '#FF6D01' },
  { name: 'พัฒนาระบบ', color: '#4285F4' },
  { name: 'ประชุม', color: '#9C27B0' },
  { name: 'งานด่วน', color: '#EA4335' },
  { name: 'งานเอกสาร', color: '#0097A7' },
  { name: 'งานการเงิน', color: '#E91E63' },
  { name: 'อื่นๆ', color: '#757575' },
];

export interface EventFormData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  category: string;
  color: string;
  note: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'in_progress' | 'completed' | 'cancelled';
  attachment?: File | null;
}
