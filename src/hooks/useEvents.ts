import { useState, useCallback } from 'react';
import api from '../utils/api';
import { Event, EventFormData } from '../types';
import toast from 'react-hot-toast';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (params?: { start_date?: string; end_date?: string; category?: string; search?: string }) => {
    setLoading(true);
    try {
      const res = await api.get('/events', { params });
      setEvents(res.data.events || res.data || []);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (data: EventFormData) => {
    try {
      const { attachment, ...jsonData } = data;
      const res = await api.post('/events', jsonData);
      const created = res.data.event || res.data;
      if (attachment instanceof File && created?.id) {
        const formData = new FormData();
        formData.append('attachment', attachment);
        await api.post(`/events/${created.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('สร้างกิจกรรมสำเร็จ');
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ไม่สามารถสร้างกิจกรรมได้');
      throw err;
    }
  }, []);

  const updateEvent = useCallback(async (id: number, data: Partial<EventFormData>) => {
    try {
      const { attachment, ...jsonData } = data;
      const res = await api.put(`/events/${id}`, jsonData);
      if (attachment instanceof File) {
        const formData = new FormData();
        formData.append('attachment', attachment);
        await api.post(`/events/${id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('อัปเดตกิจกรรมสำเร็จ');
      return res.data;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ไม่สามารถอัปเดตกิจกรรมได้');
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (id: number) => {
    try {
      await api.delete(`/events/${id}`);
      toast.success('ลบกิจกรรมสำเร็จ');
    } catch (err: any) {
      toast.error('ไม่สามารถลบกิจกรรมได้');
      throw err;
    }
  }, []);

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent };
};
