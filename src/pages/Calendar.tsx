import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import en from 'date-fns/locale/en-US';
import { ChevronLeft, ChevronRight, LogIn, Plus, Trash2, X, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { useCalendarEvents } from '../contexts/CalendarEventsContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserStorageKey } from '../utils/storage';
import { listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, CalendarEvent as GoogleCalendarEvent } from '../services/googleCalendar';
import { CalendarEvent } from '../types';
import './Calendar.css';

interface EventType {
  value: string;
  label: string;
  color: string;
}

const defaultEventTypes: EventType[] = [
  { value: 'rodaje', label: 'Shooting', color: '#2383e2' },
  { value: 'reunion', label: 'Meeting', color: '#d97706' },
  { value: 'entrega', label: 'Delivery', color: '#0f7b0f' },
  { value: 'otro', label: 'Other', color: '#9333ea' },
];

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  editingEvent?: CalendarEvent | null;
  selectedDate?: Date;
  eventTypes: EventType[];
  onAddEventType: (name: string) => void;
  onDeleteEventType: (value: string) => void;
}

function EventModal({ isOpen, onClose, onSave, editingEvent, selectedDate, eventTypes, onAddEventType, onDeleteEventType }: EventModalProps) {
  const { projects } = useProjects();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('otro');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setType(editingEvent.type);
      setDate(format(new Date(editingEvent.date), 'yyyy-MM-dd'));
      setTime(editingEvent.time || '');
      setProjectId(editingEvent.projectId || '');
    } else if (selectedDate) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
      setTime('');
      setTitle('');
      setType(eventTypes.length > 0 ? eventTypes[eventTypes.length - 1].value : 'otro');
      setProjectId('');
    }
  }, [editingEvent, selectedDate, eventTypes]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
        setIsAddingType(false);
        setNewTypeName('');
      }
    };

    if (isTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTypeDropdownOpen]);

  const handleAddType = () => {
    if (newTypeName.trim() && !eventTypes.find(t => t.label.toLowerCase() === newTypeName.trim().toLowerCase())) {
      onAddEventType(newTypeName.trim());
      setNewTypeName('');
      setIsAddingType(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const eventDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      eventDate.setHours(hours, minutes);
    }

    onSave({
      title,
      type: type as 'rodaje' | 'reunion' | 'entrega' | 'otro',
      date: eventDate,
      time: time || undefined,
      projectId: projectId || undefined,
    });

    // Reset form
    setTitle('');
    setType(eventTypes.length > 0 ? eventTypes[eventTypes.length - 1].value : 'otro');
    setDate('');
    setTime('');
    setProjectId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingEvent ? 'Edit Event' : 'New Event'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <div style={{ position: 'relative' }} ref={typeDropdownRef}>
              <div 
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span>{eventTypes.find(t => t.value === type)?.label || 'Select type'}</span>
                <ChevronDown size={16} />
              </div>
              {isTypeDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px var(--shadow)',
                  }}
                >
                  {eventTypes.map(eventType => (
                    <div
                      key={eventType.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: type === eventType.value ? 'var(--bg-secondary)' : 'transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = type === eventType.value ? 'var(--bg-secondary)' : 'transparent'}
                      onClick={() => {
                        setType(eventType.value);
                        setIsTypeDropdownOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: eventType.color,
                          }}
                        />
                        <span>{eventType.label}</span>
                      </div>
                      {eventType.value !== 'otro' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEventType(eventType.value);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Delete type"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {isAddingType ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddType();
                          } else if (e.key === 'Escape') {
                            setIsAddingType(false);
                            setNewTypeName('');
                          }
                        }}
                        placeholder="Type name..."
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleAddType}
                        style={{
                          padding: '6px 8px',
                          background: 'var(--accent)',
                          color: 'var(--bg-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingType(false);
                          setNewTypeName('');
                        }}
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingType(true)}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '6px 8px',
                        background: 'transparent',
                        color: 'var(--accent)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Type</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Project (optional)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const { isAuthenticated, accessToken, login, loading } = useGoogleAuth();
  const { localEvents, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  // Removed unused projects variable
  const [currentDate, setCurrentDate] = useState(new Date());
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const syncIntervalRef = useRef<number | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>(defaultEventTypes);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Función optimizada para cargar eventos de Google Calendar (silenciosa)
  // Carga eventos del mes actual más una semana antes y después para mejor sincronización
  const loadGoogleEvents = useCallback(async () => {
    if (!accessToken) {
      console.warn('[Calendar] No access token available');
      return;
    }
    try {
      // Ampliar rango: una semana antes del inicio del mes y una semana después del final
      const extendedStart = new Date(monthStart);
      extendedStart.setDate(extendedStart.getDate() - 7);
      const extendedEnd = new Date(monthEnd);
      extendedEnd.setDate(extendedEnd.getDate() + 7);
      
      const timeMin = extendedStart.toISOString();
      const timeMax = extendedEnd.toISOString();
      
      console.log('[Calendar] Fetching events from:', timeMin, 'to', timeMax);
      
      const events = await listCalendarEvents(accessToken, timeMin, timeMax);
      
      console.log(`[Calendar] Loaded ${events.length} events from Google Calendar`);
      console.log('[Calendar] All events:', events);
      
      if (events.length > 0) {
        console.log('[Calendar] Sample events:', events.slice(0, 5).map((e: GoogleCalendarEvent) => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
        })));
      } else {
        console.warn('[Calendar] No events found. Check:');
        console.warn('1. Are events created in the PRIMARY calendar?');
        console.warn('2. Are events within the date range?');
        console.warn('3. Is the access token valid?');
        console.warn('4. Date range:', timeMin, 'to', timeMax);
      }
      
      setGoogleEvents(events);
    } catch (error) {
      console.error('[Calendar] Error loading Google Calendar events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[Calendar] Full error:', error);
      // Mostrar error solo si es un error crítico
      if (errorMessage.includes('token') || errorMessage.includes('permission') || errorMessage.includes('auth')) {
        alert(`Error de autenticación: ${errorMessage}\n\nIntenta desconectarte y volver a conectar Google Calendar.`);
      }
    }
  }, [accessToken, monthStart, monthEnd]);

  // Cargar eventos al montar y cuando cambia el mes
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      loadGoogleEvents();
    }
  }, [isAuthenticated, accessToken, currentDate, loadGoogleEvents]);

  // Cargar tipos de eventos personalizados
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(
        getUserStorageKey('calendarEventTypes', user.id)
      );
      if (saved) {
        try {
          const savedTypes = JSON.parse(saved);
          setEventTypes(savedTypes);
        } catch (e) {
          console.error('Error loading event types:', e);
        }
      }
    }
  }, [user?.id]);

  // Guardar tipos cuando cambien
  useEffect(() => {
    if (user?.id && eventTypes.length > 0) {
      localStorage.setItem(
        getUserStorageKey('calendarEventTypes', user.id),
        JSON.stringify(eventTypes)
      );
    }
  }, [eventTypes, user?.id]);

  // Funciones para manejar tipos de eventos
  const handleAddEventType = (name: string) => {
    if (name.trim() && !eventTypes.find(t => t.label.toLowerCase() === name.trim().toLowerCase())) {
      const value = name.trim().toLowerCase().replace(/\s+/g, '-');
      const colors = ['#2383e2', '#d97706', '#0f7b0f', '#9333ea', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setEventTypes([...eventTypes, { value, label: name.trim(), color: randomColor }]);
    }
  };

  const handleDeleteEventType = (typeValue: string) => {
    if (typeValue === 'otro') return; // No se puede eliminar "Other"
    setEventTypes(eventTypes.filter(t => t.value !== typeValue));
  };

  // Generar colores y labels dinámicamente desde eventTypes
  const eventTypeColors = eventTypes.reduce((acc, type) => {
    acc[type.value] = type.color;
    return acc;
  }, {} as Record<string, string>);

  const eventTypeLabels = eventTypes.reduce((acc, type) => {
    acc[type.value] = type.label;
    return acc;
  }, {} as Record<string, string>);

  // Sincronización automática cada 15 segundos para mejor sincronización
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Cargar inmediatamente al montar
      loadGoogleEvents();
      
      // Luego sincronizar cada 15 segundos
      syncIntervalRef.current = window.setInterval(() => {
        loadGoogleEvents();
      }, 15000); // 15 segundos

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, accessToken, loadGoogleEvents]);

  // Sincronizar cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && accessToken) {
        loadGoogleEvents();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, accessToken, loadGoogleEvents]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDate(undefined);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    // Función auxiliar para calcular endTime
    const calculateEndTime = (date: Date, time?: string) => {
      const endTime = time ? new Date(date) : new Date(date.getTime() + 3600000);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        endTime.setHours(hours + 1, minutes);
      }
      return endTime;
    };

    if (editingEvent) {
      // Si es un evento de Google Calendar, actualizarlo allí
      if (editingEvent.id && editingEvent.id.startsWith('google_')) {
        if (accessToken) {
          try {
            const googleEventId = editingEvent.id.replace('google_', '');
            const endTime = calculateEndTime(eventData.date, eventData.time);
            
            // Actualizar inmediatamente en la lista local para mejor UX
            setGoogleEvents(prev => prev.map(e => 
              e.id === googleEventId 
                ? {
                    ...e,
                    summary: eventData.title,
                    start: {
                      dateTime: eventData.date.toISOString(),
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                    end: {
                      dateTime: endTime.toISOString(),
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    },
                  }
                : e
            ));
            
            // Luego actualizar en Google Calendar
            await updateCalendarEvent(accessToken, googleEventId, {
              summary: eventData.title,
              start: {
                dateTime: eventData.date.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            });
            
            // NO recargar inmediatamente - ya actualizamos la lista local
            // La sincronización automática se encargará de mantener todo actualizado
          } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            alert('Failed to update Google Calendar event');
          }
        }
      } else {
        // Actualizar evento local
        updateEvent(editingEvent.id, eventData);
        // Nota: Los eventos locales no se sincronizan automáticamente a Google Calendar
        // para evitar duplicados. Si quieres sincronizarlos, deberías crear un nuevo evento en Google.
      }
    } else {
      // Crear nuevo evento - SOLO en Google Calendar si está conectado (evitar duplicados)
      if (isAuthenticated && accessToken) {
        try {
          const endTime = calculateEndTime(eventData.date, eventData.time);
          
          console.log('[Calendar] Creating new event in Google Calendar:', {
            title: eventData.title,
            date: eventData.date.toISOString(),
            endTime: endTime.toISOString(),
          });
          
          const createdEvent = await createCalendarEvent(accessToken, {
            summary: eventData.title,
            start: {
              dateTime: eventData.date.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          });
          
          console.log('[Calendar] Event created successfully:', createdEvent);
          
          // Agregar el evento creado directamente a la lista (más rápido que recargar)
          if (createdEvent && createdEvent.id) {
            const newGoogleEvent: GoogleCalendarEvent = {
              id: createdEvent.id,
              summary: createdEvent.summary || eventData.title,
              start: createdEvent.start || {
                dateTime: eventData.date.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: createdEvent.end || {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            };
            
            // Agregar a la lista de eventos existentes de forma optimizada
            setGoogleEvents(prev => {
              // Verificar que no esté ya en la lista
              const exists = prev.some(e => e.id === newGoogleEvent.id);
              if (exists) {
                console.log('[Calendar] Event already in list, skipping duplicate');
                return prev;
              }
              console.log('[Calendar] Adding new event to list:', newGoogleEvent);
              // Agregar al inicio para mejor UX (el evento más reciente aparece primero)
              return [newGoogleEvent, ...prev];
            });
            
            // NO recargar inmediatamente - el evento ya está agregado
            // La sincronización automática cada 15 segundos se encargará de mantener todo actualizado
          } else {
            // Si no se pudo obtener el evento creado, recargar después de un delay
            setTimeout(() => {
              loadGoogleEvents();
            }, 2000);
          }
          
        } catch (error) {
          console.error('[Calendar] Error creating Google Calendar event:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          alert(`Error al crear evento: ${errorMessage}\n\nVerifica la consola (F12) para más detalles.`);
          // Si falla, crear localmente como respaldo
          addEvent(eventData);
        }
      } else {
        // Si NO está conectado, crear solo localmente
        addEvent(eventData);
      }
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    // Si es un evento de Google Calendar, eliminarlo allí
    if (event.id && event.id.startsWith('google_')) {
      if (accessToken) {
        try {
          const googleEventId = event.id.replace('google_', '');
          
          // Eliminar inmediatamente de la lista local para mejor UX
          setGoogleEvents(prev => prev.filter(e => e.id !== googleEventId));
          
          // Luego eliminar de Google Calendar
          await deleteCalendarEvent(accessToken, googleEventId);
          
          // NO recargar inmediatamente - ya lo eliminamos de la lista
          // La sincronización automática se encargará de mantener todo actualizado
        } catch (error) {
          console.error('[Calendar] Error deleting Google Calendar event:', error);
          // Si falla, recargar para restaurar el evento
          loadGoogleEvents();
          alert('Failed to delete Google Calendar event');
        }
      }
    } else {
      // Eliminar evento local
      deleteEvent(event.id);
    }
  };

  // Memoizar eventos procesados para evitar recálculos innecesarios
  const processedGoogleEvents = useMemo(() => {
    return googleEvents.map((event) => {
      // Determinar la fecha del evento
      let eventDate: Date;
      let eventTime: string = '';
      
      if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
        eventTime = format(eventDate, 'HH:mm');
      } else if (event.start?.date) {
        eventDate = new Date(event.start.date);
        eventTime = ''; // Todo el día
      } else {
        eventDate = new Date();
      }
      
      return {
        id: `google_${event.id || ''}`,
        title: event.summary || 'Untitled Event',
        date: eventDate,
        time: eventTime,
        type: 'otro' as const,
        projectId: undefined,
        originalEvent: event, // Guardar referencia al evento original
      };
    });
  }, [googleEvents]);

  // Función optimizada para obtener eventos de una fecha específica
  const getEventsForDate = useCallback((date: Date) => {
    // Eventos locales
    const localEventsForDate = localEvents.filter((event) => isSameDay(new Date(event.date), date));
    
    // Eventos de Google Calendar (usando eventos procesados memoizados)
    const googleEventsForDate = processedGoogleEvents.filter((event) => {
      return isSameDay(event.date, date);
    });

    return [...localEventsForDate, ...googleEventsForDate];
  }, [localEvents, processedGoogleEvents]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate empty days at the start of the month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="calendar-header">
          <h1>Calendar</h1>
        </div>
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>Calendar</h1>
        <div className="calendar-controls">
          <button onClick={previousMonth} className="calendar-nav-button">
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendar-month-title">
            {format(currentDate, 'MMMM yyyy', { locale: en })}
          </h2>
          <button onClick={nextMonth} className="calendar-nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isAuthenticated && (
            <button className="btn-secondary" onClick={login}>
              <LogIn size={18} />
              <span>Connect Google Calendar</span>
            </button>
          )}
          {isAuthenticated && accessToken && (
            <button 
              className="btn-secondary" 
              onClick={async () => {
                console.log('[Calendar] Manual refresh triggered');
                try {
                  await loadGoogleEvents();
                  console.log('[Calendar] Refresh completed successfully');
                } catch (error) {
                  console.error('[Calendar] Refresh error:', error);
                  alert('Error al actualizar eventos. Verifica la consola (F12) para más detalles.');
                }
              }}
              title="Actualizar eventos del calendario"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
          )}
          <button className="btn-primary" onClick={() => {
            setSelectedDate(undefined);
            setEditingEvent(null);
            setShowEventModal(true);
          }}>
            <Plus size={18} />
            <span>New Event</span>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="calendar-day empty"></div>
          ))}
          {daysInMonth.map((day) => {
            const events = getEventsForDate(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isCurrentDay ? 'today' : ''}`}
                onClick={() => handleDayClick(day)}
                style={{ cursor: 'pointer' }}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-events">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{
                        backgroundColor: `${eventTypeColors[event.type]}20`,
                        color: eventTypeColors[event.type],
                        borderLeft: `3px solid ${eventTypeColors[event.type]}`,
                        position: 'relative',
                      }}
                      onClick={(e) => handleEventClick(e, event)}
                    >
                      <div className="calendar-event-time">{event.time || 'All day'}</div>
                      <div className="calendar-event-title">{event.title}</div>
                      <div className="calendar-event-type">
                        {eventTypeLabels[event.type]}
                      </div>
                      <div className="calendar-event-actions" onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event);
                      }}>
                        <Trash2 size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          {eventTypes.map((eventType) => (
            <div key={eventType.value} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: eventType.color }}
              ></div>
              <span>{eventType.label}</span>
            </div>
          ))}
        </div>
      </div>

      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setSelectedDate(undefined);
        }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        selectedDate={selectedDate}
        eventTypes={eventTypes}
        onAddEventType={handleAddEventType}
        onDeleteEventType={handleDeleteEventType}
      />
    </div>
  );
}
