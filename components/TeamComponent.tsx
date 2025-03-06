"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IoChatbubbleEllipsesOutline, IoCalendarOutline, IoCallOutline } from "react-icons/io5";
import { TbCheckbox } from "react-icons/tb";
import { Users, ListTodo, Calendar } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  dueDate?: Date;
  completed: boolean;
  projectId?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}

interface UserData {
  id: string;
  name?: string;
  email?: string;
  todos: Todo[];
  events: CalendarEvent[];
  organizationId?: string;
}

interface TeamComponentProps {
  onChatSelect?: (userId: string) => void;
}

const TeamComponent: React.FC<TeamComponentProps> = ({ onChatSelect }) => {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching users for TeamComponent, session:", session);
        const response = await fetch("/api/getAllUsers", {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const filteredUsers = data.filter(
            (user: UserData) =>
              user.id !== session?.user?.id &&
              user.organizationId === session?.user?.organizationId
          );

          // Fetch todos and events for each user
          const usersWithData = await Promise.all(
            filteredUsers.map(async (user: UserData) => {
              const [todosRes, eventsRes] = await Promise.all([
                fetch(`/api/todos?userId=${user.id}`, {
                  headers: { Authorization: `Bearer ${session?.accessToken}` },
                }),
                fetch(`/api/calendar?userId=${user.id}`, {
                  headers: { Authorization: `Bearer ${session?.accessToken}` },
                }),
              ]);

              const todosData = todosRes.ok ? await todosRes.json() : [];
              const eventsData = eventsRes.ok
                ? (await eventsRes.json()).map((event: CalendarEvent) => ({
                    ...event,
                    startTime: new Date(event.startTime),
                    endTime: new Date(event.endTime),
                  }))
                : [];

              return {
                ...user,
                todos: todosData,
                events: eventsData,
              };
            })
          );

          setUsers(usersWithData);
        } else {
          console.error("Failed to fetch users:", response.status, await response.text());
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchCurrentUserTodos = async () => {
      try {
        const response = await fetch("/api/todos", {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTodos(data);
        }
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    const fetchCurrentUserEvents = async () => {
      try {
        const response = await fetch("/api/calendar", {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const formattedEvents = data.map((event: CalendarEvent) => ({
            ...event,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
          }));
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      Promise.all([fetchUsers(), fetchCurrentUserTodos(), fetchCurrentUserEvents()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [session, status]);

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("");
    }
    return email ? email[0].toUpperCase() : "?";
  };

  const handleMessageClick = (userId: string) => {
    if (onChatSelect) {
      onChatSelect(userId);
    }
  };

  const getUncompletedTodosCount = () => {
    return todos.filter((todo) => !todo.completed).length;
  };

  const getHighPriorityCount = () => {
    return todos.filter(
      (todo) => !todo.completed && (todo.priority === "HIGH" || todo.priority === "URGENT")
    ).length;
  };

  const getTodayEventsCount = () => {
    const today = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }).length;
  };

  const getUserUncompletedTodosCount = (userTodos: Todo[]) => {
    return userTodos.filter((todo) => !todo.completed).length;
  };

  const getUserTodayEventsCount = (userEvents: CalendarEvent[]) => {
    const today = new Date();
    return userEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }).length;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 border-l-[1.5px] border-gray-300 dark:border-gray-500">
      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <h3 className="text-2xl font-bold">{users.length}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Todo Tasks</p>
                <h3 className="text-2xl font-bold">{getUncompletedTodosCount()}</h3>
                <p className="text-sm text-purple-500">{getHighPriorityCount()} high priority</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <ListTodo className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-300" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calendar Events</p>
                <h3 className="text-2xl font-bold">{events.length}</h3>
                <p className="text-sm text-orange-500">{getTodayEventsCount()} today</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300" />
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {users.length === 0 ? (
              <p className="text-center text-gray-500">No team members found in your organization.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-purple-600 text-white">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.name || "Unnamed User"}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <TbCheckbox className="w-4 h-4" />
                          <span>Todo Tasks: {getUserUncompletedTodosCount(user.todos)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <IoCalendarOutline className="w-4 h-4" />
                          <span>Events Today: {getUserTodayEventsCount(user.events)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 p-2 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-white/85 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                          <IoCallOutline className="w-4 h-4 inline mr-1" />
                          Call
                        </button>
                        <button
                          onClick={() => handleMessageClick(user.id)}
                          className="flex-1 p-2 text-sm rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-white/85 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                        >
                          <IoChatbubbleEllipsesOutline className="w-4 h-4 inline mr-1" />
                          Message
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamComponent;