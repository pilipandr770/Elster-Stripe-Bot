import React, { useState, useEffect } from 'react';
import { getCalendarEvents } from '../services/calendarService';

interface CalendarEventsProps {
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  limit?: number;
  onEventClick?: (event: any) => void;
}

const CalendarEvents: React.FC<CalendarEventsProps> = ({
  startDate = new Date().toISOString(),
  endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to a week from now
  limit = 5,
  onEventClick
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedEvents = await getCalendarEvents(startDate, endDate);
        setEvents(fetchedEvents.slice(0, limit));
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Could not load calendar events');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [startDate, endDate, limit]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h3 className="text-lg font-medium p-4 border-b">Upcoming Events</h3>
      <ul className="divide-y divide-gray-200">
        {events.map((event) => (
          <li 
            key={event.id}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onEventClick && onEventClick(event)}
          >
            <div className="flex justify-between">
              <h4 className="font-medium text-gray-800">{event.summary}</h4>
              <span className="text-sm text-gray-500">
                {formatEventTime(event.start?.dateTime || event.start?.date)}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1 truncate">{event.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to format event time
function formatEventTime(dateTimeStr: string): string {
  const date = new Date(dateTimeStr);
  return date.toLocaleString('de-DE', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default CalendarEvents;
