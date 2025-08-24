import { GoogleCalendarConfig } from '../types';

const BASE_URL = 'http://localhost:5000/api/secretary';

/**
 * Helper function to get auth token
 */
function getAuthToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return token;
}

/**
 * Connect Google Calendar using OAuth
 * @param authCode The authorization code from OAuth flow
 */
export async function connectGoogleCalendar(authCode: string): Promise<{ success: boolean, calendarId?: string }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ auth_code: authCode })
    });
    
    if (!response.ok) {
      throw new Error('Failed to connect Google Calendar');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    throw error;
  }
}

/**
 * Update Google Calendar configuration
 * @param config The calendar configuration
 */
export async function updateCalendarConfig(config: GoogleCalendarConfig): Promise<{ success: boolean }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update calendar configuration');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating calendar configuration:', error);
    throw error;
  }
}

/**
 * Fetch events from Google Calendar
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 */
export async function getCalendarEvents(startDate: string, endDate: string): Promise<any[]> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/events?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

/**
 * Create a new event in Google Calendar
 * @param eventData Event data to create
 */
export async function createCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
}): Promise<any> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Update an existing event in Google Calendar
 * @param eventId The ID of the event to update
 * @param eventData Event data to update
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    attendees?: string[];
  }
): Promise<any> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Delete an event from Google Calendar
 * @param eventId The ID of the event to delete
 */
export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}
