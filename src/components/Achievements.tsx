import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Medal, 
  Star, 
  Zap, 
  Target, 
  Calendar, 
  Timer, 
  TrendingUp,
  Crown,
  Award,
  CheckCircle2,
  Flame,
  Users,
  Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Achievements = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPomodoros: 0,
    totalTasks: 0,
    totalFocusHours: 0,
    streak: 0
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      // Fetch stats for progress tracking
      const { data: allStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const totalPomodoros = allStats?.reduce((sum, day) => sum + day.pomodoro_sessions, 0) || 0;
      const totalTasks = allStats?.reduce((sum, day) => sum + day.tasks_completed, 0) || 0;
      const totalFocusHours = allStats?.reduce((sum, day) => sum + day.focus_time, 0) || 0;

      // Calculate streak
      let currentStreak = 0;
      if (allStats && allStats.length > 0) {
        const today = new Date();
        let checkDate = new Date(today);
        
        for (const stat of allStats) {
          const statDate = new Date(stat.date);
          const daysDiff = Math.floor((checkDate.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 0 || daysDiff === 1) {
            if (stat.pomodoro_sessions > 0 || stat.tasks_completed > 0) {
              currentStreak++;
              checkDate = statDate;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      setStats({
        totalPomodoros,
        totalTasks,
        totalFocusHours,
        streak: currentStreak
      });

      // Define achievements with progress
      const allAchievements = [
        {
          id: 'first_pomodoro',
          title: "First Steps",
          description: "Complete your first Pomodoro session",
          icon: Timer,
          earned: totalPomodoros >= 1,
          rarity: "common",
          points: 50,
          progress: Math.min(100, (totalPomodoros / 1) * 100)
        },
        {
          id: 'early_bird',
          title: "Early Bird",
          description: "Complete 5 Pomodoro sessions",
          icon: Zap,
          earned: totalPomodoros >= 5,
          rarity: "common",
          points: 100,
          progress: Math.min(100, (totalPomodoros / 5) * 100)
        },
        {
          id: 'task_master',
          title: "Task Master",
          description: "Complete 10 tasks",
          icon: CheckCircle2,
          earned: totalTasks >= 10,
          rarity: "common",
          points: 100,
          progress: Math.min(100, (totalTasks / 10) * 100)
        },
        {
          id: 'dedicated',
          title: "Dedicated",
          description: "Maintain a 3-day streak",
          icon: Flame,
          earned: currentStreak >= 3,
          rarity: "common",
          points: 150,
          progress: Math.min(100, (currentStreak / 3) * 100)
        },
        {
          id: 'focus_rookie',
          title: "Focus Rookie",
          description: "Log 5 hours of focused work",
          icon: Target,
          earned: totalFocusHours >= 300,
          rarity: "common",
          points: 150,
          progress: Math.min(100, (totalFocusHours / 300) * 100)
        },
        {
          id: 'productive_week',
          title: "Productive Week",
          description: "Complete 25 Pomodoro sessions",
          icon: Calendar,
          earned: totalPomodoros >= 25,
          rarity: "rare",
          points: 250,
          progress: Math.min(100, (totalPomodoros / 25) * 100)
        },
        {
          id: 'focus_warrior',
          title: "Focus Warrior",
          description: "Complete 50 Pomodoro sessions",
          icon: Zap,
          earned: totalPomodoros >= 50,
          rarity: "rare",
          points: 400,
          progress: Math.min(100, (totalPomodoros / 50) * 100)
        },
        {
          id: 'goal_crusher',
          title: "Goal Crusher",
          description: "Complete 50 tasks",
          icon: Target,
          earned: totalTasks >= 50,
          rarity: "rare",
          points: 300,
          progress: Math.min(100, (totalTasks / 50) * 100)
        },
        {
          id: 'consistency_king',
          title: "Consistency King",
          description: "Maintain a 7-day streak",
          icon: Flame,
          earned: currentStreak >= 7,
          rarity: "rare",
          points: 400,
          progress: Math.min(100, (currentStreak / 7) * 100)
        },
        {
          id: 'focus_veteran',
          title: "Focus Veteran",
          description: "Log 25 hours of focused work",
          icon: TrendingUp,
          earned: totalFocusHours >= 1500,
          rarity: "rare",
          points: 500,
          progress: Math.min(100, (totalFocusHours / 1500) * 100)
        },
        {
          id: 'century_club',
          title: "Century Club",
          description: "Complete 100 Pomodoro sessions",
          icon: Medal,
          earned: totalPomodoros >= 100,
          rarity: "epic",
          points: 750,
          progress: Math.min(100, (totalPomodoros / 100) * 100)
        },
        {
          id: 'task_demolisher',
          title: "Task Demolisher",
          description: "Complete 100 tasks",
          icon: Award,
          earned: totalTasks >= 100,
          rarity: "epic",
          points: 600,
          progress: Math.min(100, (totalTasks / 100) * 100)
        },
        {
          id: 'unstoppable',
          title: "Unstoppable",
          description: "Maintain a 14-day streak",
          icon: Flame,
          earned: currentStreak >= 14,
          rarity: "epic",
          points: 800,
          progress: Math.min(100, (currentStreak / 14) * 100)
        },
        {
          id: 'focus_expert',
          title: "Focus Expert",
          description: "Log 50 hours of focused work",
          icon: TrendingUp,
          earned: totalFocusHours >= 3000,
          rarity: "epic",
          points: 900,
          progress: Math.min(100, (totalFocusHours / 3000) * 100)
        },
        {
          id: 'time_lord',
          title: "Time Lord",
          description: "Log 100 hours of focused work",
          icon: Crown,
          earned: totalFocusHours >= 6000,
          rarity: "legendary",
          points: 1500,
          progress: Math.min(100, (totalFocusHours / 6000) * 100)
        },
        {
          id: 'productivity_legend',
          title: "Productivity Legend",
          description: "Complete 250 Pomodoro sessions",
          icon: Crown,
          earned: totalPomodoros >= 250,
          rarity: "legendary",
          points: 2000,
          progress: Math.min(100, (totalPomodoros / 250) * 100)
        },
        {
          id: 'marathon_master',
          title: "Marathon Master",
          description: "Maintain a 30-day streak",
          icon: Flame,
          earned: currentStreak >= 30,
          rarity: "legendary",
          points: 2500,
          progress: Math.min(100, (currentStreak / 30) * 100)
        }
      ];

      setAchievements(allAchievements);

      // Award points and update level
      await updatePointsAndLevel(user.id, allAchievements, userAchievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const updatePointsAndLevel = async (userId: string, allAchievements: any[], userAchievements: any[]) => {
    try {
      // Check for newly earned achievements
      const earnedAchievements = allAchievements.filter(a => a.earned);
      const existingAchievementIds = new Set(userAchievements.map(a => a.achievement_id));
      
      // Insert new achievements
      for (const achievement of earnedAchievements) {
        if (!existingAchievementIds.has(achievement.id)) {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id
            });
        }
      }

      // Calculate total points from earned achievements
      const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
      const level = Math.floor(totalPoints / 500) + 1;

      // Update today's stats with current level and points
      const today = new Date().toISOString().split('T')[0];
      const { data: todayStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (todayStats) {
        await supabase
          .from('user_stats')
          .update({ points: totalPoints, level })
          .eq('id', todayStats.id);
      } else {
        await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            date: today,
            points: totalPoints,
            level
          });
      }
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  // Calculate XP from earned achievements
  const earnedAchievements = achievements.filter(a => a.earned);
  const totalXP = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const xpInCurrentLevel = totalXP % 500;
  const xpForNextLevel = 500;

  const userLevel = {
    current: currentLevel,
    progress: (xpInCurrentLevel / xpForNextLevel) * 100,
    pointsInLevel: totalXP,
    pointsForNext: currentLevel * 500,
    title: currentLevel >= 10 ? "Productivity Master" : currentLevel >= 5 ? "Rising Star" : "Beginner"
  };

  const badges = [
    { name: "Pomodoros", count: stats.totalPomodoros, icon: Timer, color: "text-primary" },
    { name: "Tasks Done", count: stats.totalTasks, icon: Target, color: "text-secondary" },
    { name: "Focus Hours", count: Math.floor(stats.totalFocusHours / 60), icon: Zap, color: "text-accent" },
    { name: "Current Streak", count: stats.streak, icon: Flame, color: "text-destructive" }
  ];

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "bg-muted text-muted-foreground",
      rare: "bg-primary/10 text-primary border-primary/20",
      epic: "bg-secondary/10 text-secondary border-secondary/20",
      legendary: "bg-warning/10 text-warning border-warning/20"
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityIcon = (rarity: string) => {
    return rarity === 'legendary' ? Crown : 
           rarity === 'epic' ? Medal : 
           rarity === 'rare' ? Star : Trophy;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Achievements & Gamification</h2>
          <Badge className="bg-gold/10 text-warning border-warning/20">
            <Crown className="w-3 h-3 mr-1" />
            {userLevel.title}
          </Badge>
        </div>
      </div>

      {/* Level Progress */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{userLevel.current}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Level {userLevel.current}</h3>
                <p className="text-muted-foreground">{userLevel.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{userLevel.pointsInLevel}</div>
              <div className="text-sm text-muted-foreground">/ {userLevel.pointsForNext} XP</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {userLevel.current + 1}</span>
              <span>{userLevel.progress}%</span>
            </div>
            <Progress value={userLevel.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements Grid */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Achievements ({achievements.filter(a => a.earned).length}/{achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const RarityIcon = getRarityIcon(achievement.rarity);
                return (
                  <Card 
                    key={achievement.id} 
                    className={`transition-all duration-300 ${
                      achievement.earned 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-border/50 bg-muted/20 opacity-75'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          achievement.earned 
                            ? 'bg-gradient-to-br from-primary to-accent' 
                            : 'bg-muted'
                        }`}>
                          <achievement.icon className={`w-6 h-6 ${achievement.earned ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground truncate">{achievement.title}</h4>
                            <RarityIcon className="w-4 h-4 text-warning" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge className={getRarityColor(achievement.rarity)}>
                              {achievement.rarity}
                            </Badge>
                            <div className="text-sm font-medium text-primary">
                              +{achievement.points} XP
                            </div>
                          </div>
                          {!achievement.earned && achievement.progress !== undefined && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{Math.round(achievement.progress)}%</span>
                              </div>
                              <Progress value={achievement.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Badge Collection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-accent" />
                Badge Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.map((badge, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <badge.icon className={`w-5 h-5 ${badge.color}`} />
                    <span className="font-medium">{badge.name}</span>
                  </div>
                  <Badge variant="outline">{badge.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-success" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="font-medium text-success">Custom Theme</div>
                <div className="text-sm text-muted-foreground">Unlock at Level 15</div>
                <div className="text-xs text-success mt-1">500 XP needed</div>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="font-medium text-primary">Premium Analytics</div>
                <div className="text-sm text-muted-foreground">Unlock at Level 20</div>
                <div className="text-xs text-primary mt-1">1200 XP needed</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Achievements;