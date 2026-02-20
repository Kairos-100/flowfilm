import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CalendarEvent } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { getUserStorageKey } from '../utils/storage';

interface CalendarEventsContextType {
  localEvents: CalendarEvent[];
  loading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const CalendarEventsContext = createContext<CalendarEventsContextType | undefined>(undefined);

export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Migrar datos de localStorage a Supabase (solo una vez)
  const migrateFromLocalStorage = useCallback(async (userId: string) => {
    try {
      // Verificar si ya hay datos en Supabase
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // Si ya hay datos en Supabase, no migrar
      if (existingEvents && existingEvents.length > 0) {
        return;
      }

      // Migrar eventos
      const saved = localStorage.getItem(getUserStorageKey('calendarEvents', userId));
      if (saved) {
        const parsed = JSON.parse(saved);
        const eventsToInsert = parsed.map((e: CalendarEvent) => ({
          id: e.id,
          user_id: userId,
          project_id: e.projectId || null,
          title: e.title,
          date: new Date(e.date).toISOString().split('T')[0],
          time: e.time || null,
          type: e.type,
        }));

        if (eventsToInsert.length > 0) {
          await supabase.from('calendar_events').insert(eventsToInsert);
        }
      }
    } catch (error) {
      console.error('Error migrating calendar events from localStorage:', error);
    }
  }, []);

  // Cargar eventos desde Supabase
  const loadEvents = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // Migrar datos de localStorage si es necesario
      await migrateFromLocalStorage(userId);

      // Cargar eventos
      const { data: eventsData, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) throw error;

      const loadedEvents = (eventsData || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.date),
        time: e.time,
        projectId: e.project_id,
        type: e.type,
      }));

      setLocalEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading calendar events from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, [migrateFromLocalStorage]);

  // Cargar eventos cuando userId esté disponible
  useEffect(() => {
    if (userId) {
      loadEvents(userId);
    } else {
      setLocalEvents([]);
      setLoading(false);
    }
  }, [userId, loadEvents]);

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!userId) return;

    try {
      const newId = Date.now().toString();
      const { error } = await supabase.from('calendar_events').insert({
        id: newId,
        user_id: userId,
        project_id: event.projectId || null,
        title: event.title,
        date: event.date.toISOString().split('T')[0],
        time: event.time || null,
        type: event.type,
      });

      if (error) throw error;

      const newEvent: CalendarEvent = {
        ...event,
        id: newId,
      };
      setLocalEvents([...localEvents, newEvent]);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.time !== undefined) updateData.time = updates.time || null;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId || null;
      if (updates.type !== undefined) updateData.type = updates.type;

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      setLocalEvents(localEvents.map(e => 
        e.id === eventId ? { ...e, ...updates } : e
      ));
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      setLocalEvents(localEvents.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  };

  return (
    <CalendarEventsContext.Provider value={{ localEvents, loading, addEvent, updateEvent, deleteEvent }}>
      {children}
    </CalendarEventsContext.Provider>
  );
}

export function useCalendarEvents() {
  const context = useContext(CalendarEventsContext);
  if (!context) {
    throw new Error('useCalendarEvents must be used within CalendarEventsProvider');
  }
  return context;
}
