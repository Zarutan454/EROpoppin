import { google } from 'googleapis';
import { logger } from '../utils/logger';

// Initialize Google Calendar API
const calendar = google.calendar('v3');
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

interface CalendarEventOptions {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  conferenceData?: {
    createRequest?: {
      requestId?: string;
      conferenceSolutionKey?: {
        type: string;
      };
    };
  };
}

// Create calendar event
export const createCalendarEvent = async ({
  title,
  description,
  start,
  end,
  location,
  attendees,
  reminders = { useDefault: true },
  conferenceData,
}: CalendarEventOptions): Promise<string> => {
  try {
    const event = {
      summary: title,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC',
      },
      location,
      attendees: attendees?.map((email) => ({ email })),
      reminders,
      conferenceData,
    };

    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: conferenceData ? 1 : 0,
    });

    logger.info('Calendar event created:', {
      eventId: response.data.id,
      title,
      start,
      end,
    });

    return response.data.id!;
  } catch (error) {
    logger.error('Create calendar event error:', error);
    throw error;
  }
};

// Update calendar event
export const updateCalendarEvent = async (
  eventId: string,
  updates: Partial<CalendarEventOptions>
): Promise<void> => {
  try {
    const event: any = {};

    if (updates.title) event.summary = updates.title;
    if (updates.description) event.description = updates.description;
    if (updates.location) event.location = updates.location;
    if (updates.start) {
      event.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (updates.end) {
      event.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (updates.attendees) {
      event.attendees = updates.attendees.map((email) => ({ email }));
    }
    if (updates.reminders) event.reminders = updates.reminders;
    if (updates.conferenceData) event.conferenceData = updates.conferenceData;

    await calendar.events.patch({
      auth,
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    logger.info('Calendar event updated:', { eventId });
  } catch (error) {
    logger.error('Update calendar event error:', error);
    throw error;
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    await calendar.events.delete({
      auth,
      calendarId: 'primary',
      eventId,
    });

    logger.info('Calendar event deleted:', { eventId });
  } catch (error) {
    logger.error('Delete calendar event error:', error);
    throw error;
  }
};

// Get calendar event
export const getCalendarEvent = async (eventId: string) => {
  try {
    const response = await calendar.events.get({
      auth,
      calendarId: 'primary',
      eventId,
    });

    return response.data;
  } catch (error) {
    logger.error('Get calendar event error:', error);
    throw error;
  }
};

// List calendar events
export const listCalendarEvents = async (
  timeMin: Date,
  timeMax: Date,
  maxResults: number = 100
) => {
  try {
    const response = await calendar.events.list({
      auth,
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    logger.error('List calendar events error:', error);
    throw error;
  }
};

// Create video conference
export const createVideoConference = async (
  title: string,
  start: Date,
  end: Date
): Promise<string> => {
  try {
    const event = await createCalendarEvent({
      title,
      start,
      end,
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    });

    const eventDetails = await getCalendarEvent(event);
    return eventDetails.conferenceData?.entryPoints?.[0].uri || '';
  } catch (error) {
    logger.error('Create video conference error:', error);
    throw error;
  }
};

// Check availability
export const checkAvailability = async (
  start: Date,
  end: Date
): Promise<boolean> => {
  try {
    const events = await listCalendarEvents(start, end);
    return events?.length === 0;
  } catch (error) {
    logger.error('Check availability error:', error);
    throw error;
  }
};

// Find available slots
export const findAvailableSlots = async (
  date: Date,
  duration: number // in minutes
): Promise<Array<{ start: Date; end: Date }>> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM

    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // End at 5 PM

    const events = await listCalendarEvents(startOfDay, endOfDay);
    const slots: Array<{ start: Date; end: Date }> = [];
    let currentTime = startOfDay;

    events?.forEach((event) => {
      const eventStart = new Date(event.start?.dateTime || '');
      const eventEnd = new Date(event.end?.dateTime || '');

      // Check if there's a slot before the event
      if (currentTime < eventStart) {
        const slotDuration =
          (eventStart.getTime() - currentTime.getTime()) / (60 * 1000);
        if (slotDuration >= duration) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(currentTime.getTime() + duration * 60 * 1000),
          });
        }
      }
      currentTime = eventEnd;
    });

    // Check for slot after last event
    if (currentTime < endOfDay) {
      const slotDuration =
        (endOfDay.getTime() - currentTime.getTime()) / (60 * 1000);
      if (slotDuration >= duration) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(currentTime.getTime() + duration * 60 * 1000),
        });
      }
    }

    return slots;
  } catch (error) {
    logger.error('Find available slots error:', error);
    throw error;
  }
};

export default {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  createVideoConference,
  checkAvailability,
  findAvailableSlots,
};