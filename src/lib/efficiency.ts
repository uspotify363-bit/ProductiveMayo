/**
 * Calculate efficiency score based on productivity metrics
 * 
 * Efficiency is calculated based on:
 * - Task completion rate (planned tasks vs completed)
 * - Pomodoro completion rate
 * - Focus time consistency
 * 
 * Returns a score from 0-100
 */

interface EfficiencyParams {
  tasksPlanned?: number;
  tasksCompleted: number;
  pomodorosSessions: number;
  focusTime: number; // in minutes
}

export const calculateEfficiency = ({
  tasksPlanned = 0,
  tasksCompleted,
  pomodorosSessions,
  focusTime
}: EfficiencyParams): number => {
  // Return 0 if no activity
  if (tasksCompleted === 0 && pomodorosSessions === 0 && focusTime === 0) {
    return 0;
  }

  let efficiency = 0;

  // Component 1: Task completion (35% weight)
  if (tasksCompleted > 0) {
    if (tasksPlanned > 0) {
      // If we have planned tasks, calculate completion rate
      const completionRate = Math.min(100, (tasksCompleted / tasksPlanned) * 100);
      efficiency += completionRate * 0.35;
    } else {
      // If no planned tasks, give credit based on completed tasks (capped at 35%)
      const taskScore = Math.min(100, tasksCompleted * 20);
      efficiency += taskScore * 0.35;
    }
  }

  // Component 2: Pomodoro consistency (35% weight)
  // Ideal: 6-10 pomodoros per day (2.5-4 hours of focused work)
  if (pomodorosSessions > 0) {
    const idealRange = { min: 6, max: 10 };
    let pomodoroScore = 100;
    
    if (pomodorosSessions < idealRange.min) {
      pomodoroScore = (pomodorosSessions / idealRange.min) * 100;
    } else if (pomodorosSessions > idealRange.max) {
      pomodoroScore = Math.max(70, 100 - (pomodorosSessions - idealRange.max) * 5);
    }
    
    efficiency += pomodoroScore * 0.35;
  }

  // Component 3: Focus time quality (30% weight)
  // Ideal: 2-6 hours of focused work per day (120-360 minutes)
  if (focusTime > 0) {
    const idealRange = { min: 120, max: 360 }; // minutes
    let focusScore = 100;
    
    if (focusTime < idealRange.min) {
      focusScore = (focusTime / idealRange.min) * 100;
    } else if (focusTime > idealRange.max) {
      focusScore = Math.max(80, 100 - ((focusTime - idealRange.max) / 60) * 3);
    }
    
    efficiency += focusScore * 0.30;
  }

  // Return final score (0-100)
  return Math.round(Math.min(100, Math.max(0, efficiency)));
};

/**
 * Update efficiency score for today's stats
 */
export const updateDailyEfficiency = async (
  supabase: any,
  userId: string,
  additionalTasks: number = 0
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's stats - refetch to ensure we have latest data
  const { data: stats, error: fetchError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching stats:', fetchError);
    return;
  }

  if (!stats) {
    console.error('No stats found for today');
    return;
  }

  // Get today's planned tasks from calendar
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('completed')
    .eq('user_id', userId)
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`);

  const tasksPlanned = allTasks?.length || 0;
  const tasksCompleted = (stats.tasks_completed || 0) + additionalTasks;

  const efficiency = calculateEfficiency({
    tasksPlanned,
    tasksCompleted,
    pomodorosSessions: stats.pomodoro_sessions || 0,
    focusTime: stats.focus_time || 0
  });

  console.log('Calculating efficiency with:', {
    date: today,
    tasksPlanned,
    tasksCompleted,
    pomodoros: stats.pomodoro_sessions || 0,
    focusTime: stats.focus_time || 0,
    calculatedEfficiency: efficiency
  });

  // Update both efficiency score and tasks_completed if additionalTasks provided
  const updateData: any = { efficiency_score: efficiency };
  if (additionalTasks > 0) {
    updateData.tasks_completed = tasksCompleted;
  }

  const { error } = await supabase
    .from('user_stats')
    .update(updateData)
    .eq('id', stats.id);

  if (error) {
    console.error('Error updating efficiency:', error);
  } else {
    console.log('Efficiency updated successfully to:', efficiency);
  }
};
