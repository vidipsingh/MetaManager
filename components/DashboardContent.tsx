import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, Calendar, ListTodo } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
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

interface Props {
  onTodoClick: () => void;
}

const DashboardContent = ({ onTodoClick }: Props) => {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/getAllUsers');
                if (response.ok) {
                    const data = await response.json();
                    const filteredUsers = data.filter(user => user.id !== session?.user?.id);
                    setUsers(filteredUsers);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        const fetchTodos = async () => {
            try {
                const response = await fetch('/api/todos');
                if (response.ok) {
                    const data = await response.json();
                    setTodos(data);
                }
            } catch (error) {
                console.error('Error fetching todos:', error);
            }
        };

        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/calendar');
                if (response.ok) {
                    const data = await response.json();
                    const formattedEvents = data.map((event: any) => ({
                        ...event,
                        startTime: new Date(event.startTime),
                        endTime: new Date(event.endTime),
                    }));
                    setEvents(formattedEvents);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        if (session?.user?.id) {
            Promise.all([fetchUsers(), fetchTodos(), fetchEvents()])
                .finally(() => setIsLoading(false));
        }
    }, [session?.user?.id]);

    const getUncompletedTodosCount = () => {
        return todos.filter(todo => !todo.completed).length;
    };

    const getHighPriorityCount = () => {
        return todos.filter(todo => !todo.completed && (todo.priority === 'HIGH' || todo.priority === 'URGENT')).length;
    };

    const getTodayEventsCount = () => {
        const today = new Date();
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === today.getDate() &&
                   eventDate.getMonth() === today.getMonth() &&
                   eventDate.getFullYear() === today.getFullYear();
        }).length;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            LOW: 'text-gray-500 bg-gray-100',
            NORMAL: 'text-blue-500 bg-blue-100',
            HIGH: 'text-yellow-600 bg-yellow-100',
            URGENT: 'text-red-500 bg-red-100',
        };
        return colors[priority] || colors.NORMAL;
    };

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

            {/* Todo List Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4 ">
                            {todos
                                .filter(todo => !todo.completed)
                                .sort((a, b) => {
                                    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
                                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                                })
                                .map((todo) => (
                                    <div key={todo.id} className="p-4 rounded-lg border dark:border-gray-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-gray-900" onClick={onTodoClick}>
                                        <div className="flex justify-between items-start mb-2 ">
                                            <div>
                                                <h4 className="font-semibold">{todo.title}</h4>
                                                {todo.dueDate && (
                                                    <p className="text-sm text-gray-500">
                                                        Due: {format(new Date(todo.dueDate), 'PPP')}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(todo.priority)}`}>
                                                {todo.priority}
                                            </span>
                                        </div>
                                        {todo.description && (
                                            <p className="text-sm text-gray-500 mt-2">{todo.description}</p>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardContent;