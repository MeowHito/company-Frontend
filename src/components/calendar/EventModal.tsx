import React, { useState, useEffect } from 'react';
import { Event, EventFormData, CATEGORIES } from '../../types';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  event?: Event | null;
  defaultDate?: Date;
  defaultHour?: number;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, defaultDate, defaultHour }) => {
  const [form, setForm] = useState<EventFormData>({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    category: CATEGORIES[0].name,
    color: CATEGORIES[0].color,
    note: '',
    priority: 'medium',
    status: 'in_progress',
    attachment: null,
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description || '',
        start_datetime: event.start_datetime.slice(0, 16),
        end_datetime: event.end_datetime.slice(0, 16),
        category: event.category,
        color: event.color,
        note: event.note || '',
        priority: event.priority,
        status: event.status,
        attachment: null,
      });
    } else {
      const d = defaultDate || new Date();
      const hour = defaultHour ?? d.getHours();
      const startStr = format(d, 'yyyy-MM-dd') + 'T' + String(hour).padStart(2, '0') + ':00';
      const endHour = Math.min(hour + 1, 23);
      const endStr = format(d, 'yyyy-MM-dd') + 'T' + String(endHour).padStart(2, '0') + ':00';
      setForm({
        title: '',
        description: '',
        start_datetime: startStr,
        end_datetime: endStr,
        category: CATEGORIES[0].name,
        color: CATEGORIES[0].color,
        note: '',
        priority: 'medium',
        status: 'in_progress',
        attachment: null,
      });
    }
    setShowDeleteConfirm(false);
  }, [event, defaultDate, defaultHour, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (catName: string) => {
    const cat = CATEGORIES.find((c) => c.name === catName);
    setForm({ ...form, category: catName, color: cat?.color || '#4285F4' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.start_datetime || !form.end_datetime) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'ต่ำ' },
    { value: 'medium', label: 'ปานกลาง' },
    { value: 'high', label: 'สูง' },
    { value: 'urgent', label: 'ด่วน' },
  ];

  const statusOptions = [
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold dark:text-white">
            {event ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อกิจกรรม *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="ระบุชื่อกิจกรรม"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รายละเอียด</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เริ่มต้น *</label>
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สิ้นสุด *</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                className="input-field text-sm"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${form.category === cat.name ? 'scale-125 border-gray-800 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: cat.color }}
                  title={cat.name}
                />
              ))}
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ความสำคัญ</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="input-field">
                {priorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สถานะ</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="input-field">
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมายเหตุ</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">แนบไฟล์</label>
            <input
              type="file"
              onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] || null })}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 dark:file:bg-gray-700 dark:file:text-gray-300"
            />
            {event?.attachment && (
              <p className="text-xs text-gray-400 mt-1">ไฟล์ปัจจุบัน: {event.attachment}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {event && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-500">ยืนยันลบ?</span>
                    <button type="button" onClick={handleDelete} disabled={saving} className="btn-danger text-sm px-3 py-1">ลบ</button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm px-3 py-1">ยกเลิก</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600 text-sm font-medium">
                    ลบกิจกรรม
                  </button>
                )}
              </>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn-secondary">ยกเลิก</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
