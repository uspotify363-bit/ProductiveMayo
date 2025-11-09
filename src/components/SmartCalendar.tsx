import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  MoreVertical
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateDailyEfficiency } from "@/lib/efficiency";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  start_time: string;
  end_time: string;
  completed: boolean;
}

const SmartCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'work',
    date: '',
    startTime: '',
    endTime: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Week starts on Monday
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(monday);
      endOfWeek.setDate(monday.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', monday.toISOString())
        .lte('start_time', endOfWeek.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('fetchTasks supabase error:', error);
        toast({ title: 'Error', description: 'Failed to load tasks: ' + (error.message || JSON.stringify(error)), variant: 'destructive' });
        return;
      }
      setTasks(data || []);
    } catch (err) {
      console.error('fetchTasks unexpected error:', err);
      toast({ title: 'Error', description: 'Unexpected error loading tasks', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    // basic validation
    if (!newTask.title || !newTask.date || !newTask.startTime || !newTask.endTime) {
      toast({ title: 'Error', description: 'Fill in all required fields', variant: 'destructive' });
      return;
    }

    // build Date objects
    const startDateTime = new Date(`${newTask.date}T${newTask.startTime}`);
    const endDateTime = new Date(`${newTask.date}T${newTask.endTime}`);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast({ title: 'Error', description: 'Invalid date/time', variant: 'destructive' });
      return;
    }
    if (endDateTime <= startDateTime) {
      toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    try {
      // get current user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error('auth.getUser error:', userErr);
        toast({ title: 'Auth error', description: 'Could not get user info', variant: 'destructive' });
        return;
      }
      const userId = (userData as any)?.user?.id;
      if (!userId) {
        toast({ title: 'Not authenticated', description: 'Please sign in to create tasks', variant: 'destructive' });
        return;
      }

      const payload = {
        user_id: userId,
        title: newTask.title,
        description: newTask.description,
        type: newTask.type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString()
      };

      // Insert and return the inserted row
      const { data: inserted, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('createTask supabase insert error:', error);
        // show detailed message if available
        const detail = (error as any).message || JSON.stringify(error);
        toast({ title: 'Create failed', description: detail, variant: 'destructive' });
        return;
      }

      // success: add to local state so UI updates immediately
      if (inserted) {
        setTasks(prev => {
          // keep sorted by start_time ascending
          const next = [...prev, inserted];
          next.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
          return next;
        });
      }

      toast({ title: 'Success', description: 'Task created' });
      setIsDialogOpen(false);
      setNewTask({ title: '', description: '', type: 'work', date: '', startTime: '', endTime: '' });

      // optional: refetch to be 100% in sync
      fetchTasks();
    } catch (err) {
      console.error('createTask unexpected error:', err);
      toast({ title: 'Error', description: 'Unexpected error when creating task', variant: 'destructive' });
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId);
      if (error) {
        console.error('toggleTaskCompletion error:', error);
        toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        return;
      }
      
      // Update user_stats when task is completed
      if (!completed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const today = new Date().toISOString().split('T')[0];
          const { data: existingStats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

          if (existingStats) {
            await supabase
              .from('user_stats')
              .update({
                tasks_completed: (existingStats.tasks_completed || 0) + 1
              })
              .eq('id', existingStats.id);
          } else {
            await supabase
              .from('user_stats')
              .insert({
                user_id: user.id,
                date: today,
                tasks_completed: 1
              });
          }

          // Update efficiency score
          await updateDailyEfficiency(supabase, user.id, 1);
        }
      }
      
      // Optimistically update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
      toast({ title: 'Success', description: completed ? 'Task marked as incomplete' : 'Task completed!' });
    } catch (err) {
      console.error('toggleTaskCompletion unexpected:', err);
      toast({ title: 'Error', description: 'Unexpected error updating task', variant: 'destructive' });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
        return;
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: 'Success', description: 'Task deleted' });
    } catch (err) {
      console.error('deleteTask error:', err);
      toast({ title: 'Error', description: 'Unexpected error deleting task', variant: 'destructive' });
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    const startDate = new Date(task.start_time);
    setNewTask({
      title: task.title,
      description: task.description || '',
      type: task.type,
      date: startDate.toISOString().slice(0, 10),
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: new Date(task.end_time).toTimeString().slice(0, 5)
    });
    setIsDialogOpen(true);
  };

  const updateTask = async () => {
    if (!selectedTask) return;
    
    if (!newTask.title || !newTask.date || !newTask.startTime || !newTask.endTime) {
      toast({ title: 'Error', description: 'Fill in all required fields', variant: 'destructive' });
      return;
    }

    const startDateTime = new Date(`${newTask.date}T${newTask.startTime}`);
    const endDateTime = new Date(`${newTask.date}T${newTask.endTime}`);
    
    if (endDateTime <= startDateTime) {
      toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: newTask.title,
          description: newTask.description,
          type: newTask.type,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString()
        })
        .eq('id', selectedTask.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Task updated' });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setNewTask({ title: '', description: '', type: 'work', date: '', startTime: '', endTime: '' });
      fetchTasks();
    } catch (err) {
      console.error('updateTask error:', err);
      toast({ title: 'Error', description: 'Unexpected error updating task', variant: 'destructive' });
    }
  };

  // helper: open dialog prefilled (works for week/day)
  const handleCellClick = (dayIndex: number, hour: number) => {
    // determine date clicked
    let clickedDate = new Date(currentDate);
    if (view === 'week') {
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
      clickedDate = new Date(monday);
      clickedDate.setDate(monday.getDate() + dayIndex);
    } else {
      // day view: dayIndex is ignored; use currentDate
      clickedDate = new Date(currentDate);
    }

    const isoDate = clickedDate.toISOString().slice(0,10); // YYYY-MM-DD
    setNewTask(prev => ({
      ...prev,
      date: isoDate,
      startTime: `${String(hour).padStart(2,'0')}:00`,
      endTime: `${String(hour+1).padStart(2,'0')}:00`
    }));
    setIsDialogOpen(true);
  };

  // UI constants
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({length:24}, (_,i) => i); // 0..23 (full day)

  // filtered tasks for rendering (day vs week)
  const filteredTasks = view === 'day'
    ? tasks.filter(t => new Date(t.start_time).toDateString() === currentDate.toDateString())
    : tasks;

  const getEventColor = (type: string, completed: boolean = false) => {
    const opacity = completed ? '10' : '20';
    const textOpacity = completed ? 'opacity-50 line-through' : '';
    
    switch(type){
      case 'meeting': 
        return `bg-blue-500/${opacity} border-blue-500 text-blue-700 ${textOpacity}`;
      case 'work': 
        return `bg-primary/${opacity} border-primary text-primary ${textOpacity}`;
      case 'personal': 
        return `bg-purple-500/${opacity} border-purple-500 text-purple-700 ${textOpacity}`;
      case 'learning':
        return `bg-accent/${opacity} border-accent text-accent ${textOpacity}`;
      default: 
        return `bg-muted/${opacity} border-border text-foreground ${textOpacity}`;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch(type) {
      case 'meeting': return '👥';
      case 'work': return '💼';
      case 'personal': return '🏠';
      case 'learning': return '📚';
      default: return '📌';
    }
  };

  // safe arrow handlers (avoid mutating currentDate)
  const prevDay = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const nextDay = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Smart Calendar</h2>
          <Badge className="bg-primary/10 text-primary border-primary/20">Live Data</Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant={view === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setView('day')}>Day</Button>
            <Button variant={view === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setView('week')}>Week</Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevDay}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-medium min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: view === 'day' ? 'numeric' : undefined })}
            </span>
            <Button variant="outline" size="sm" onClick={nextDay}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedTask(null);
              setNewTask({ title: '', description: '', type: 'work', date: '', startTime: '', endTime: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {selectedTask ? 'Edit Task' : 'Create New Task'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Task title..." 
                    value={newTask.title} 
                    onChange={e => setNewTask({...newTask, title: e.target.value})} 
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Add details..." 
                    value={newTask.description} 
                    onChange={e => setNewTask({...newTask, description: e.target.value})} 
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium">Type *</Label>
                  <Select value={newTask.type} onValueChange={v => setNewTask({...newTask, type: v})}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="meeting">👥 Meeting</SelectItem>
                      <SelectItem value="personal">🏠 Personal</SelectItem>
                      <SelectItem value="learning">📚 Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newTask.date} 
                    onChange={e => setNewTask({...newTask, date: e.target.value})} 
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="startTime" className="text-sm font-medium">Start Time *</Label>
                    <Input 
                      id="startTime" 
                      type="time" 
                      value={newTask.startTime} 
                      onChange={e => setNewTask({...newTask, startTime: e.target.value})} 
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm font-medium">End Time *</Label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={newTask.endTime} 
                      onChange={e => setNewTask({...newTask, endTime: e.target.value})} 
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={selectedTask ? updateTask : createTask} 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                  >
                    {selectedTask ? 'Update Task' : 'Create Task'}
                  </Button>
                  {selectedTask && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedTask(null);
                        setNewTask({ title: '', description: '', type: 'work', date: '', startTime: '', endTime: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* day title */}
      {view === 'day' && (
        <div className="p-4 text-lg font-semibold text-center border-b">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* calendar grid */}
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardContent className="p-0">
            {/* header row */}
            <div className={`grid ${view === 'week' ? 'grid-cols-8' : 'grid-cols-2'} border-b border-border/50`}>
              <div className="p-4 text-sm font-medium text-muted-foreground">Time</div>
              {view === 'week' ? weekDays.map((day, idx) => {
                const monday = new Date(currentDate);
                monday.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + idx);
                return <div key={day} className="p-4 text-center"><div className="text-sm font-medium">{day}</div><div className="text-xs text-muted-foreground">{dayDate.getDate()}</div></div>;
              }) : (
                <div className="p-4 text-center">
                  <div className="text-sm font-medium">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  <div className="text-xs text-muted-foreground">{currentDate.getDate()}</div>
                </div>
              )}
            </div>

            {/* hours */}
            <div className="max-h-[600px] overflow-y-auto">
              {hours.map(hour => (
                <div key={hour} className={`grid ${view === 'week' ? 'grid-cols-8' : 'grid-cols-2'} border-b border-border/20 min-h-[60px]`}>
                  <div className="p-4 text-sm text-muted-foreground border-r border-border/20">{hour}:00</div>
                  {(view === 'week' ? weekDays : ['day']).map((_, dayIndex) => (
                    <div 
                      key={`${dayIndex}-${hour}`} 
                      className="border-r border-border/20 p-1.5 relative cursor-pointer hover:bg-primary/5 transition-colors group" 
                      onClick={() => handleCellClick(dayIndex, hour)}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 rounded flex items-center justify-center">
                        <Plus className="w-4 h-4 text-primary/40" />
                      </div>
                      
                      {filteredTasks.filter(task => {
                        const s = new Date(task.start_time);
                        const taskHour = s.getHours();
                        if (view === 'week') {
                          const taskDay = (s.getDay() + 6) % 7;
                          return taskHour === hour && taskDay === dayIndex;
                        } else {
                          return taskHour === hour && s.toDateString() === currentDate.toDateString();
                        }
                      }).map(task => (
                        <TooltipProvider key={task.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  "text-xs p-2 rounded-lg border-l-4 mb-1 cursor-pointer transition-all hover:shadow-md group/task relative",
                                  getEventColor(task.type, task.completed)
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium flex items-center gap-1.5">
                                      <span className="text-sm">{getTaskTypeIcon(task.type)}</span>
                                      <span className="truncate block max-w-[120px]">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs opacity-70 mt-0.5">
                                      <Clock className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">
                                        {new Date(task.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                        {' - '}
                                        {new Date(task.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-6 p-0 opacity-0 group-hover/task:opacity-100 transition-opacity flex-shrink-0"
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-50 bg-background">
                                      <DropdownMenuItem onClick={() => toggleTaskCompletion(task.id, task.completed)}>
                                        {task.completed ? <Circle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => deleteTask(task.id)} 
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                {task.completed && (
                                  <Badge variant="outline" className="mt-1 text-xs bg-success/10 text-success border-success/20">
                                    ✓ Complete
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs z-50">
                              <div className="space-y-1">
                                <p className="font-semibold">{getTaskTypeIcon(task.type)} {task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground">{task.description}</p>
                                )}
                                <p className="text-xs">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {new Date(task.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                  {' - '}
                                  {new Date(task.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* sidebar (always shown) */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {view === 'day' 
                  ? `Tasks for ${currentDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}` 
                  : `Tasks for ${currentDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <div className="text-center text-muted-foreground">Loading tasks...</div> : (
                tasks
                  .filter(task => {
                    const taskDate = new Date(task.start_time);
                    return taskDate.toDateString() === currentDate.toDateString();
                  })
                  .map(task => (
                    <TooltipProvider key={task.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "p-3 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
                            getEventColor(task.type, task.completed)
                          )}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg flex-shrink-0">{getTaskTypeIcon(task.type)}</span>
                                  <h4 className="font-medium text-sm truncate">{task.title}</h4>
                                </div>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {new Date(task.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                                    {' - '}
                                    {new Date(task.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-50 bg-background">
                                  <DropdownMenuItem onClick={() => toggleTaskCompletion(task.id, task.completed)}>
                                    {task.completed ? <Circle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteTask(task.id)} 
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {task.completed && (
                              <Badge variant="outline" className="mt-2 text-xs bg-success/10 text-success border-success/20">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs z-50">
                          <div className="space-y-1">
                            <p className="font-semibold">{getTaskTypeIcon(task.type)} {task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}
                            <p className="text-xs">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(task.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                              {' - '}
                              {new Date(task.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
              )}
              {!isLoading && tasks.filter(task => new Date(task.start_time).toDateString() === currentDate.toDateString()).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tasks scheduled for this day</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setNewTask({
                        ...newTask,
                        date: currentDate.toISOString().slice(0, 10)
                      });
                      setIsDialogOpen(true);
                    }}
                    className="mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add a task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendar;
