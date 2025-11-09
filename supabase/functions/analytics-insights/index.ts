import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Extract token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Authentication failed");
    }

    console.log("Generating AI insights for user:", user.id);

    // Fetch user's productivity data
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: pomodoroSessions } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Prepare analytics summary for AI
    const totalFocusTime = userStats?.reduce((sum, day) => sum + day.focus_time, 0) || 0;
    const totalTasks = userStats?.reduce((sum, day) => sum + day.tasks_completed, 0) || 0;
    const avgEfficiency = userStats?.length 
      ? userStats.reduce((sum, day) => sum + day.efficiency_score, 0) / userStats.length 
      : 0;
    const totalPomodoros = userStats?.reduce((sum, day) => sum + day.pomodoro_sessions, 0) || 0;

    // Calculate daily patterns
    const hourlyPattern: Record<number, number> = {};
    pomodoroSessions?.forEach(session => {
      const hour = new Date(session.started_at).getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
    });

    const tasksByType = tasks?.reduce((acc: any, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});

    const completionRate = tasks?.length 
      ? (tasks.filter(t => t.completed).length / tasks.length) * 100 
      : 0;

    const analyticsData = {
      totalFocusTime: Math.round(totalFocusTime / 60),
      totalTasks,
      avgEfficiency: Math.round(avgEfficiency),
      totalPomodoros,
      completionRate: Math.round(completionRate),
      tasksByType,
      mostProductiveHours: Object.entries(hourlyPattern)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([hour]) => parseInt(hour)),
      recentDays: userStats?.slice(0, 7).map(day => ({
        date: day.date,
        focusTime: day.focus_time,
        tasksCompleted: day.tasks_completed,
        efficiency: day.efficiency_score
      }))
    };

    const prompt = `Analyze this productivity data and generate 4 specific, actionable insights:

Data Summary:
- Total Focus Time (last 30 days): ${analyticsData.totalFocusTime} hours
- Tasks Completed: ${analyticsData.totalTasks}
- Average Efficiency: ${analyticsData.avgEfficiency}%
- Task Completion Rate: ${analyticsData.completionRate}%
- Pomodoro Sessions: ${analyticsData.totalPomodoros}
- Most Productive Hours: ${analyticsData.mostProductiveHours.join(', ')}
- Task Distribution: ${JSON.stringify(analyticsData.tasksByType)}
- Recent Week: ${JSON.stringify(analyticsData.recentDays)}

Generate exactly 4 insights in this JSON format:
{
  "insights": [
    {
      "title": "Insight title (2-4 words)",
      "metric": "+12%" or "85%" or similar,
      "description": "One sentence actionable insight",
      "type": "success" | "info" | "warning" | "primary"
    }
  ]
}

Focus on:
1. Peak performance times and scheduling recommendations
2. Focus/efficiency trends (improvements or concerns)
3. Break patterns or session length optimization
4. Weekly/monthly progress and goal achievement

Be specific, data-driven, and actionable. Return ONLY the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a productivity analytics expert. Analyze user data and provide specific, actionable insights in JSON format only."
          },
          { 
            role: "user", 
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Extract JSON from response
    let insightsData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insightsData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse insights from AI response");
    }

    console.log("AI insights generated successfully");
    return new Response(
      JSON.stringify(insightsData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Analytics Insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});