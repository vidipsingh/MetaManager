'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'react-hot-toast';
import HoverableCheckbox from './ui/HoverableCheckbox';

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  completed: boolean;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

const ListComponent = () => {
  const { data: session, status } = useSession();
  const toast = useToast(); // Changed this line
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'NORMAL' as const,
    dueDate: undefined as Date | undefined,
    projectId: undefined as string | undefined,
  });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTodos();
      fetchProjects();
    }
  }, [status]);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      toast.addToast({ // Corrected line
        title: "Error",
        description: "Failed to fetch todos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error:', error);
      // toast.error('Failed to fetch projects');
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) {
      // toast.error('Title is required');
      return;
    }
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) throw new Error('Failed to add todo');
      
      const todo = await response.json();
      setTodos([todo, ...todos]);
      setNewTodo({
        title: '',
        description: '',
        priority: 'NORMAL',
        dueDate: undefined,
        projectId: undefined,
      });
      
      // toast.success('Todo added successfully');
    } catch (error) {
      // toast.error('Failed to add todo');
    }
  };

  const handleUpdateTodo = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      });

      if (!response.ok) throw new Error('Failed to update todo');

      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === updatedTodo.id ? updatedTodo : t));
      setEditingTodo(null);
      setIsDialogOpen(false);
      
      // toast.success('Todo updated successfully');
    } catch (error) {
      // toast.error('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo');
      
      setTodos(todos.filter(todo => todo.id !== id));
      
      // toast.success('Todo deleted successfully');
    } catch (error) {
      // toast.error('Failed to delete todo');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      
      // Optimistically update UI
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
      
      // Add delay before deletion if completed
      if (!todo.completed) {
        setTimeout(() => {
          handleDeleteTodo(todo.id);
        }, 1000);
      }
      
      await handleUpdateTodo(updatedTodo);
    } catch (error) {
      // Revert optimistic update on error
      setTodos(todos.map(t => t.id === todo.id ? todo : t));
      // toast.error('Failed to update todo');
    }
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

  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to view your todos</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-purple-700">
          <CardTitle className="text-white text-2xl">My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Add a new task..."
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="flex-1"
              />
              <div className="w-32">
                <Select
                  value={newTodo.priority}
                  onValueChange={(value) => setNewTodo({ ...newTodo, priority: value as Todo['priority'] })}
                  // className="dark:hover:bg-gray-300"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[200px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTodo.dueDate ? format(newTodo.dueDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTodo.dueDate}
                        onSelect={(date) => setNewTodo({ ...newTodo, dueDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </form>

          {/* Todo List */}
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200",
                  todo.completed ? "bg-gray-400 dark:bg-gray-800" : "bg-white dark:bg-zinc-300"
                )}
              >
                <HoverableCheckbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                />
                <div className="flex-1">
                  <div className={cn(
                    "font-medium text-lg dark:text-black",
                    todo.completed && "line-through text-gray-500 dark:text-black"
                  )}>
                    {todo.title}
                  </div>
                  {todo.description && (
                    <div className="text-sm text-gray-500 dark:text-black mt-1">{todo.description}</div>
                  )}
                  {todo.dueDate && (
                    <div className="text-sm text-gray-500 mt-1 dark:text-black flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {format(new Date(todo.dueDate), 'PPP')}
                    </div>
                  )}
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  getPriorityColor(todo.priority)
                )}>
                  {todo.priority}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(todo)}
                  className="hover:text-yellow-300 hover:bg-yellow-100"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="hover:bg-red-100 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Todo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTodo && (
            <div className="space-y-4">
              <Input
                value={editingTodo.title}
                onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                placeholder="Task title"
              />
              <Textarea
                value={editingTodo.description || ''}
                onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                placeholder="Description"
              />
              <Select
                value={editingTodo.priority}
                onValueChange={(value) => setEditingTodo({ ...editingTodo, priority: value as Todo['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full bg-white/80 hover:text-white/40">
                    <CalendarIcon className="mr-2 h-4 w-4 "/>
                    {editingTodo.dueDate ? format(new Date(editingTodo.dueDate), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editingTodo.dueDate ? new Date(editingTodo.dueDate) : undefined}
                    onSelect={(date) => setEditingTodo({ ...editingTodo, dueDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className='dark:hover:text-white/80'>Cancel</Button>
            <Button onClick={() => editingTodo && handleUpdateTodo(editingTodo)} className=' dark:text-white dark:hover:text-white/80'>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListComponent;