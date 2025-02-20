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
// import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import HoverableCheckbox from './ui/HoverableCheckbox';
import { create } from 'ipfs-http-client';

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

const ipfs = create({ url: 'https://ipfs.infura.io:5001' });

const ListComponent = () => {
  const { data: session, status } = useSession();
  // const { toast } = useToast();
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
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);

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
      
      const cid = await ipfs.add(JSON.stringify(data));
      setIpfsCid(cid.path);
      console.log("IPFS CID:", cid.path);
    } catch (error) {
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
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) throw new Error('Failed to add todo');
      
      const todo = await response.json();
      const updatedTodos = [todo, ...todos];
      setTodos(updatedTodos);
      
      const cid = await ipfs.add(JSON.stringify(updatedTodos));
      setIpfsCid(cid.path);
      
      setNewTodo({
        title: '',
        description: '',
        priority: 'NORMAL',
        dueDate: undefined,
        projectId: undefined,
      });
      

    } catch (error) {
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
      const updatedTodos = todos.map(t => t.id === updatedTodo.id ? updatedTodo : t);
      setTodos(updatedTodos);
      
      const cid = await ipfs.add(JSON.stringify(updatedTodos));
      setIpfsCid(cid.path);
      console.log("Updated IPFS CID:", cid.path);
      
      setEditingTodo(null);
      setIsDialogOpen(false);

    } catch (error) {
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo');
      
      const updatedTodos = todos.filter(todo => todo.id !== id);
      setTodos(updatedTodos);
      
      const cid = await ipfs.add(JSON.stringify(updatedTodos));
      setIpfsCid(cid.path);
      console.log("Deleted IPFS CID:", cid.path);

    } catch (error) {
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
      
      if (!todo.completed) {
        setTimeout(() => {
          handleDeleteTodo(todo.id);
        }, 1000);
      }
      
      await handleUpdateTodo(updatedTodo);
    } catch (error) {
      setTodos(todos.map(t => t.id === todo.id ? t : t));
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
    <div className="p-6 h-screen space-y-6 max-w-5xl border-l-[1.5px] border-gray-300 dark:border-gray-500">
      <Card className="shadow-lg">
        <CardHeader className="bg-purple-700">
          <CardTitle className="text-white text-2xl flex justify-between items-center">
            <span>My Tasks</span>
            {ipfsCid && (
              <span className="text-sm break-all">
                IPFS: {ipfsCid}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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

          <div className="space-y-3">
            {todos.map((todo) => (
              <div key={todo.id} className={cn(
                "flex items-center gap-4 p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200",
                todo.completed ? "bg-gray-400 dark:bg-gray-800" : "bg-white dark:bg-zinc-300"
              )}>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => editingTodo && handleUpdateTodo(editingTodo)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListComponent;