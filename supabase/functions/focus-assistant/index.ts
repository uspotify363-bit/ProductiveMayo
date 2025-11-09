import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, task, timeLeft, cycleCount, functionCall } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // If this is a function call response, just return the result
    if (functionCall) {
      return new Response(
        JSON.stringify({ result: functionCall }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a multilingual Focus Assistant helping users maximize their productivity during work sessions. You fluently understand and respond in Russian, English, and other languages.

Context:
- Current task: ${task || 'Break time'}
- Time remaining: ${Math.floor(timeLeft / 60)} minutes
- Completed cycles: ${cycleCount}

IMPORTANT: You understand Russian language perfectly. When users write in Russian (e.g., "подготовить речь" for "prepare speech" or "презентация" for "presentation"), respond naturally in the same language and provide appropriate strategies.

You have access to powerful tools to help users:
- Break down complex tasks into actionable steps (works for any language)
- Estimate time requirements for tasks (понимаете русский)
- Suggest proven focus techniques (применяются для любых задач)
- Recommend strategic break timing (адаптируется под задачу)
- Analyze productivity patterns (анализ работы)

Use these tools proactively when they would help the user. Respond in the user's language. Be concise, actionable, and encouraging.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "recommend_daily_strategy",
          description: "Recommend a personalized focus strategy based on the user's daily goal. Adapt work/break intervals to match the task type (e.g., 50/10 for coding, 25/5 for exam prep, 45/15 for deep work).",
          parameters: {
            type: "object",
            properties: {
              strategyName: { 
                type: "string", 
                description: "Name of the strategy (e.g., 'Deep Work Blocks', 'Quick Learning Sprints', 'Code Flow Sessions')" 
              },
              workMinutes: { 
                type: "number", 
                description: "Duration of work intervals in minutes. Examples: 50 for coding, 25 for exam prep, 45 for deep work, 30 for creative work" 
              },
              breakMinutes: { 
                type: "number", 
                description: "Duration of break intervals in minutes. Examples: 10 for 50min work, 5 for 25min work" 
              },
              description: { 
                type: "string", 
                description: "Brief explanation of why this strategy works for this goal" 
              },
              technique: { 
                type: "string", 
                description: "Specific productivity technique to apply (e.g., 'Feynman Technique' for study, 'Flow State' for coding, 'Active Recall' for exams)" 
              }
            },
            required: ["strategyName", "workMinutes", "breakMinutes", "description", "technique"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "break_down_task",
          description: "Break a complex task into smaller, manageable subtasks with clear steps",
          parameters: {
            type: "object",
            properties: {
              task: { type: "string", description: "The task to break down" },
              subtasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step: { type: "string", description: "A specific subtask or step" },
                    estimatedMinutes: { type: "number", description: "Estimated time in minutes" }
                  },
                  required: ["step", "estimatedMinutes"]
                }
              }
            },
            required: ["task", "subtasks"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "suggest_focus_technique",
          description: "Recommend a specific focus technique based on the task and context",
          parameters: {
            type: "object",
            properties: {
              technique: { 
                type: "string", 
                enum: ["deep-work", "time-blocking", "two-minute-rule", "eat-the-frog", "batching"],
                description: "The recommended focus technique"
              },
              reason: { type: "string", description: "Why this technique fits the current situation" },
              howToApply: { type: "string", description: "Concrete steps to apply this technique" }
            },
            required: ["technique", "reason", "howToApply"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "estimate_task_duration",
          description: "Provide a realistic time estimate for completing a task",
          parameters: {
            type: "object",
            properties: {
              task: { type: "string" },
              estimatedMinutes: { type: "number", description: "Estimated completion time" },
              pomodoroSessions: { type: "number", description: "Number of 25-min pomodoro sessions needed" },
              confidence: { 
                type: "string", 
                enum: ["high", "medium", "low"],
                description: "Confidence level in this estimate"
              },
              factors: { 
                type: "array", 
                items: { type: "string" },
                description: "Key factors affecting the estimate"
              }
            },
            required: ["task", "estimatedMinutes", "pomodoroSessions", "confidence", "factors"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "recommend_break_timing",
          description: "Suggest when and how to take breaks based on current work session",
          parameters: {
            type: "object",
            properties: {
              recommendation: { 
                type: "string",
                enum: ["take-break-now", "continue-working", "short-break-soon", "long-break-needed"],
                description: "Break timing recommendation"
              },
              reasoning: { type: "string", description: "Why this break timing is recommended" },
              breakActivity: { type: "string", description: "Suggested activity during the break" }
            },
            required: ["recommendation", "reasoning", "breakActivity"]
          }
        }
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Focus assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
