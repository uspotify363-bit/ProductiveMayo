import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, TrendingUp, Target, Coffee, 
  LayoutDashboard, BarChart3, Trophy, Calendar, 
  Wand2, Timer, LogOut, Menu, X, ChevronRight, Sparkles 
} from "lucide-react";
import Analytics from "./Analytics";
import Achievements from "./Achievements";
import SmartCalendar from "./SmartCalendar";
import PlanGenerator from "./PlanGenerator";
import AIFocus from "./AIFocus";
import ChatAssistant from "./ChatAssistant";

interface DashboardProps {
  user: any;
  onLogout: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const Dashboard = ({ user, onLogout, activeModule, setActiveModule }: DashboardProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    focusTime: "0m",
    completedPomodoros: 0,
    totalTasks: 0,
    efficiency: 0,
  });

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 5 seconds when on dashboard
    const interval = setInterval(() => {
      if (activeModule === 'dashboard') {
        fetchStats();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeModule]);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch today's stats from user_stats table
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("focus_time, pomodoro_sessions, tasks_completed, efficiency_score")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (statsData) {
        // Format focus time
        const totalMinutes = statsData.focus_time || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const formattedFocusTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        setStats({
          focusTime: formattedFocusTime,
          completedPomodoros: statsData.pomodoro_sessions || 0,
          totalTasks: statsData.tasks_completed || 0,
          efficiency: Math.round(statsData.efficiency_score || 0),
        });
      } else {
        // No data for today yet, show zeros
        setStats({
          focusTime: "0m",
          completedPomodoros: 0,
          totalTasks: 0,
          efficiency: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'AI Focus', icon: Timer },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'calendar', label: 'Smart Calendar', icon: Calendar },
    { id: 'planner', label: 'AI Planner', icon: Wand2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'analytics':
        return <Analytics />;
      case 'achievements':
        return <Achievements />;
      case 'calendar':
        return <SmartCalendar />;
      case 'planner':
        return <PlanGenerator />;
      case 'tracker':
        return <AIFocus />;
      case 'assistant':
        return <ChatAssistant />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <p className="text-muted-foreground mt-1">Welcome back, {user.name}!</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Today's Overview
              </Badge>
            </div>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" /> Focus Time
                    </div>
                    <div className="text-3xl font-bold text-primary">{stats.focusTime}</div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                      <Target className="w-4 h-4" /> Sessions
                    </div>
                    <div className="text-3xl font-bold text-accent">
                      {stats.completedPomodoros}
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                      <Coffee className="w-4 h-4" /> Tasks
                    </div>
                    <div className="text-3xl font-bold text-secondary">{stats.totalTasks}</div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                      <TrendingUp className="w-4 h-4" /> Efficiency
                    </div>
                    <div className="text-3xl font-bold text-warning">
                      {stats.efficiency}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.slice(1).map((item) => (
                <Card 
                  key={item.id}
                  className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => setActiveModule(item.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{item.label}</h3>
                          <p className="text-sm text-muted-foreground">Access now</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ProductivityHub
              </h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="mx-auto"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeModule === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${!sidebarOpen && 'px-2'}`}
              onClick={() => setActiveModule(item.id)}
            >
              <item.icon className={`${sidebarOpen ? 'w-5 h-5 mr-3' : 'w-5 h-5'}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onLogout}
              className="mx-auto"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
