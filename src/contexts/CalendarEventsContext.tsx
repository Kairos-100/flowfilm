import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CalendarEvent } from '../types';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/storage';

interface CalendarEventsContextType {
  localEvents: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
}

const CalendarEventsContext = createContext<CalendarEventsContextType | undefined>(undefined);

export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

  // Recargar eventos cuando userId esté disponible (después del login)
  useEffect(() => {
    if (!userId) {
      setLocalEvents([]);
      return;
    }

    // Verificar si es un usuario nuevo (lienzo en blanco)
    const isNewUser = localStorage.getItem(`isNewUser_${userId}`) === 'true';
    if (isNewUser) {
      localStorage.removeItem(`isNewUser_${userId}`);
      const saved = localStorage.getItem(getUserStorageKey('calendarEvents', userId));
      if (!saved) {
        setLocalEvents([]);
        return;
      }
      // Si hay datos guardados, continuar con la carga normal
    }

    const saved = localStorage.getItem(getUserStorageKey('calendarEvents', userId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalEvents(parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        })));
      } catch (e) {
        console.error('Error loading calendar events:', e);
        setLocalEvents([]);
      }
    } else {
      setLocalEvents([]);
    }
  }, [userId]);

  // Guardar eventos cuando cambien
  useEffect(() => {
    if (userId) {
      localStorage.setItem(getUserStorageKey('calendarEvents', userId), JSON.stringify(localEvents));
    }
  }, [localEvents, userId]);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setLocalEvents([...localEvents, newEvent]);
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setLocalEvents(localEvents.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    ));
  };

  const deleteEvent = (eventId: string) => {
    setLocalEvents(localEvents.filter(e => e.id !== eventId));
  };

  return (
    <CalendarEventsContext.Provider value={{ localEvents, addEvent, updateEvent, deleteEvent }}>
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

