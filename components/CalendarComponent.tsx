'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, 
         addHours, setHours, setMinutes, isSameDay, isWithinInterval, isSameHour, differenceInHours } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_SLOTS = HOURS.map(hour => {
  const date = new Date();
  date.setHours(hour, 0, 0);
  return {
    hour,
    label: format(date, 'h:mm a')
  };
});

const CalendarComponent = () => {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchEvents();
    }
  }, [session?.user?.id, currentDate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      })));
    } catch (error) {
      console.log('Failed to fetch events', error);
    }
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedTimeSlot(date);
    setIsEditing(false);
    setNewEvent({
      id: '',
      title: '',
      description: '',
      startTime: date,
      endTime: addHours(date, 1),
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedTimeSlot(event.startTime);
    setIsEditing(true);
    
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    setNewEvent({
      id: event.id,
      title: event.title,
      description: event.description || '',
      startTime,
      endTime,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    try {
      const eventToUpdate = {
        ...newEvent,
        startTime: newEvent.startTime.toISOString(),
        endTime: newEvent.endTime.toISOString(),
      };

      const response = await fetch(`/api/calendar/${newEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventToUpdate),
      });

      if (!response.ok) throw new Error('Failed to update event');
      
      await fetchEvents();
      setIsDialogOpen(false);
    } catch (error) {
      console.log('Failed to Update events', error);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(`/api/calendar/${newEvent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');
      
      await fetchEvents();
      setIsDeleteDialogOpen(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.log('Failed to delete event', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        startTime: newEvent.startTime.toISOString(),
        endTime: newEvent.endTime.toISOString(),
      };
      console.log('Sending event data:', eventData);

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', data);
        throw new Error(data.details || data.error || 'Failed to create event');
      }
      
      console.log('Event created successfully:', data);
      await fetchEvents();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleTimeChange = (type: 'start' | 'end', timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const currentDate = type === 'start' ? newEvent.startTime : newEvent.endTime;
    
    const newTime = new Date(currentDate);
    newTime.setHours(hours, minutes);

    if (type === 'start') {
      // When changing start time, maintain the event duration
      const duration = newEvent.endTime.getTime() - newEvent.startTime.getTime();
      const newEndTime = new Date(newTime.getTime() + duration);
      
      setNewEvent({
        ...newEvent,
        startTime: newTime,
        endTime: newEndTime,
      });
    } else {
      setNewEvent({
        ...newEvent,
        endTime: newTime,
      });
    }
  };

  const daysInWeek = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  const getEventsForTimeSlot = (date: Date) => {
    return events.filter(event => {
      // Check if the event starts in this time slot
      const isStartTime = isSameDay(event.startTime, date) && 
                         isSameHour(event.startTime, date) && 
                         event.startTime.getMinutes() === 0;
      
      if (isStartTime) return true;

      // Check if this time slot is within the event's duration
      const slotStart = new Date(date);
      const slotEnd = addHours(slotStart, 1);
      
      return isWithinInterval(date, { 
        start: event.startTime,
        end: event.endTime 
      });
    });
  };

  const getEventStyle = (event: CalendarEvent, timeSlot: Date) => {
    // Calculate if this is the first time slot for the event
    const isFirstSlot = isSameHour(event.startTime, timeSlot) && 
                       event.startTime.getMinutes() === 0;

    // Only show the event content in the first time slot
    if (!isFirstSlot) return { visibility: 'hidden' as const };

    // Calculate the height based on event duration
    const durationHours = differenceInHours(event.endTime, event.startTime);
    return {
      height: `calc(${durationHours * 100}% + ${(durationHours - 1) * 2}px)`,
      zIndex: 10,
    };
  };

  return (
    <div className="p-6 border-l-[1.5px] border-gray-300 dark:border-gray-500">
      <Card className="shadow-lg">
        <CardHeader className="bg-purple-700 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-2xl">Calendar</CardTitle>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="text-white hover:bg-purple-600"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <span className="text-white font-medium">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d, yyyy')}
            </span>
            <Button
              variant="ghost"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="text-white hover:bg-purple-600"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b sticky top-0 bg-white dark:bg-black z-10">
            <div className="p-4 border-r"></div>
            {daysInWeek.map((date, i) => (
              <div key={i} className="p-4 text-center border-r">
                <div className="font-medium">{format(date, 'EEE')}</div>
                <div className="text-sm dark:text-white/60">{format(date, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="relative">
            {TIME_SLOTS.map(({ hour, label }) => (
              <div key={hour} className="grid grid-cols-8">
                <div className="p-2 text-sm text-black dark:text-white border-r">{label}</div>
                {daysInWeek.map((date, dayIndex) => {
                  const timeSlot = setMinutes(setHours(date, hour), 0);
                  const slotEvents = getEventsForTimeSlot(timeSlot);
                  
                  return (
                    <div
                      key={dayIndex}
                      className="p-2 border-r border-b min-h-[60px] relative hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                      onClick={() => handleTimeSlotClick(timeSlot)}
                    >
                      {slotEvents.map((event) => (
                        <div
                          key={event.id}
                          className="absolute inset-x-1 flex flex-col bg-violet-300 border dark:text-white/85 text-black/90 font-semibold dark:bg-violet-500 border-purple-200 rounded p-1 text-xs"
                          style={{
                            top: '2px',
                            ...getEventStyle(event, timeSlot)
                          }}
                          onClick={(e) => handleEventClick(e, event)}
                        >
                          <h1 className='dark:font-extrabold'>{event.title}</h1>
                          <h1>{format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}</h1>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Update Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <div className="flex gap-4">
              <Input
                type="time"
                value={format(newEvent.startTime, 'HH:mm')}
                onChange={(e) => handleTimeChange('start', e.target.value)}
              />
              <Input
                type="time"
                value={format(newEvent.endTime, 'HH:mm')}
                onChange={(e) => handleTimeChange('end', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              {isEditing && (
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <Button 
              onClick={isEditing ? handleUpdateEvent : handleCreateEvent} 
              className='text-white dark:text-white'
            >
              {isEditing ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarComponent;