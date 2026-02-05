export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email: string }>;
}

export async function listCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string) {
  const params = new URLSearchParams({
    calendarId: 'primary',
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250', // Aumentar límite para obtener más eventos
  });
  
  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Google Calendar API] Error response:', error);
    throw new Error(error.error?.message || 'Failed to fetch calendar events');
  }
  
  const data = await response.json();
  console.log(`[Google Calendar API] Received ${data.items?.length || 0} events`);
  return data.items || [];
}

export async function createCalendarEvent(accessToken: string, event: CalendarEvent) {
  console.log('[Google Calendar API] Creating event:', event);
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[Google Calendar API] Error creating event:', error);
    throw new Error(error.error?.message || 'Failed to create calendar event');
  }
  
  const createdEvent = await response.json();
  console.log('[Google Calendar API] Event created successfully:', createdEvent);
  return createdEvent;
}

export async function updateCalendarEvent(accessToken: string, eventId: string, event: Partial<CalendarEvent>) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update calendar event');
  }
  
  return await response.json();
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete calendar event');
  }
}


