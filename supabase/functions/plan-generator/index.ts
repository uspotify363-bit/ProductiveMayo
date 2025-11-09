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
    const { planType, goal, timeline, details, deadline } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Plan Generator request:", { planType, goal, timeline });

    const prompt = `Create a detailed, actionable plan for the following goal:

Goal: ${goal}
Type: ${planType}
Timeline: ${timeline}
${deadline ? `Deadline: ${deadline}` : ''}
${details ? `Additional Details: ${details}` : ''}

Generate a structured plan with the following JSON format:
{
  "title": "Plan title",
  "duration": "X weeks/months",
  "totalHours": estimated total hours as number,
  "phases": [
    {
      "title": "Phase name",
      "duration": "X weeks",
      "tasks": [
        {
          "task": "Task description",
          "hours": estimated hours as number,
          "priority": "high/medium/low"
        }
      ]
    }
  ]
}

Make the plan realistic, actionable, and tailored to the timeline. Include 2-4 phases with 3-6 tasks each. Return ONLY the JSON object, no additional text.`;

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
            content: "You are a productivity planning expert. Generate detailed, realistic plans in JSON format only. Be specific and actionable."
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

    // Extract JSON from response (handle cases where AI might add markdown code blocks)
    let planData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      planData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse plan data from AI response");
    }

    console.log("Plan generated successfully");
    return new Response(
      JSON.stringify({ plan: planData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Plan Generator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
