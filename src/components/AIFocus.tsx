import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { updateDailyEfficiency } from "@/lib/efficiency";
import FocusAssistant from "@/components/FocusAssistant";
import { Sparkles, Target, Clock, Zap } from "lucide-react";

import {
  usePomodoroStore,
  WORK_DURATION,
  SHORT_BREAK,
  LONG_BREAK,
  type FocusStrategy,
} from "@/store/pomodoroStore";

const AIFocus = () => {
  const {
    task,
    setTask,
    timeLeft,
    setTimeLeft,
    isRunning,
    setIsRunning,
    isBreak,
    setIsBreak,
    cycleCount,
    setCycleCount,
    status,
    setStatus,
    currentSessionId,
    setCurrentSessionId,
    dailyGoal,
    setDailyGoal,
    focusStrategy,
    setFocusStrategy,
  } = usePomodoroStore();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerEnd();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStrategyReceived = (strategy: FocusStrategy) => {
    setFocusStrategy(strategy);
    setTimeLeft(strategy.workDuration);
    toast({
      title: "Strategy Set! 🎯",
      description: `${strategy.name}: ${strategy.workDuration / 60}/${strategy.breakDuration / 60} minutes`,
    });
  };

  const handleStart = async () => {
    if (!task.trim() && !isBreak) {
      toast({
        title: "Enter a task",
        description: "Please describe your task before starting.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const duration = isBreak
      ? (focusStrategy?.breakDuration || (cycleCount === 4 ? LONG_BREAK : SHORT_BREAK))
      : (focusStrategy?.workDuration || WORK_DURATION);

    const { data, error } = await supabase
      .from("pomodoro_sessions")
      .insert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        duration,
        completed: false,
        task_name: isBreak ? "Break" : task,
        mode: isBreak ? "break" : "work",
      })
      .select()
      .single();

    if (error) return;

    setCurrentSessionId(data.id);
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(focusStrategy?.workDuration || WORK_DURATION);
    setTask("");
    setIsBreak(false);
    setStatus("Focus Time");
  };

  const handleCompleteEarly = async () => {
    if (isRunning) setIsRunning(false);
    await handleTimerEnd(true);
  };

  const handleTimerEnd = async (manual = false) => {
    setIsRunning(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!isBreak) {
      const actual = manual ? WORK_DURATION - timeLeft : WORK_DURATION;
      const focusMin = Math.round(actual / 60);
      const today = new Date().toISOString().split("T")[0];

      const { data: stats } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (stats) {
        await supabase
          .from("user_stats")
          .update({
            focus_time: stats.focus_time + focusMin,
            pomodoro_sessions: stats.pomodoro_sessions + 1,
          })
          .eq("id", stats.id);
      } else {
        await supabase.from("user_stats").insert([{
          user_id: user.id,
          date: today,
          focus_time: focusMin,
          pomodoro_sessions: 1,
          tasks_completed: 0,
          efficiency_score: 0,
        }]);
      }

      await updateDailyEfficiency(supabase, user.id);
    }

    if (isBreak) {
      setIsBreak(false);
      setStatus("Focus Time");
      setTimeLeft(focusStrategy?.workDuration || WORK_DURATION);
    } else {
      const next = cycleCount + 1;
      setCycleCount(next);
      const breakTime = focusStrategy?.breakDuration || (next % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
      setTimeLeft(breakTime);
      setStatus(next % 4 === 0 ? "Long Break" : "Short Break");
      setIsBreak(true);
    }

    setTask("");
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const maxDuration = focusStrategy 
    ? (isBreak ? focusStrategy.breakDuration : focusStrategy.workDuration)
    : (status === "Focus Time" || status === "Work" ? WORK_DURATION : status === "Long Break" ? LONG_BREAK : SHORT_BREAK);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Target className="w-6 h-6" />
              AI Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Strategy Display */}
            {focusStrategy ? (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 space-y-2 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{focusStrategy.name}</span>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {focusStrategy.workDuration / 60}/{focusStrategy.breakDuration / 60}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{focusStrategy.description}</p>
                <p className="text-xs text-primary font-medium">💡 {focusStrategy.technique}</p>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                💬 Chat with AI to get your personalized focus strategy →
              </div>
            )}

            <div className="text-center text-lg font-semibold">
              {status}
            </div>

            {!isBreak && (
              <Input
                placeholder="What are you working on?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={isRunning}
              />
            )}

            <div className="text-center text-5xl font-bold tabular-nums">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>

            <Progress
              value={(timeLeft / maxDuration) * 100}
              className="h-3"
            />

            <div className="flex justify-center gap-3">
              {!isRunning ? (
                <Button onClick={handleStart}>Start Focus</Button>
              ) : (
                <Button variant="secondary" onClick={handlePause}>Pause</Button>
              )}
              <Button variant="outline" onClick={handleReset}>Reset</Button>
              <Button variant="destructive" onClick={handleCompleteEarly}>Complete</Button>
            </div>
          </CardContent>
        </Card>

        <FocusAssistant 
          task={task} 
          timeLeft={timeLeft} 
          cycleCount={cycleCount}
          onStrategyReceived={handleStrategyReceived}
        />
      </div>
    </div>
  );
};

export default AIFocus;
