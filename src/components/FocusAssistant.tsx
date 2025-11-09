import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FocusStrategy {
  name: string;
  workDuration: number;
  breakDuration: number;
  description: string;
  technique: string;
}

interface FocusAssistantProps {
  task: string;
  timeLeft: number;
  cycleCount: number;
  onStrategyReceived?: (strategy: FocusStrategy) => void;
}

const FocusAssistant = ({ task, timeLeft, cycleCount, onStrategyReceived }: FocusAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use the Focus Assistant",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        "https://iukdhujfycckpedlotvr.supabase.co/functions/v1/focus-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            task,
            timeLeft,
            cycleCount,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.error || "Failed to get AI response",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";
      let toolCalls: any[] = [];
      let currentToolCall: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            
            // Handle tool calls
            if (delta?.tool_calls) {
              const toolCall = delta.tool_calls[0];
              if (toolCall.function?.name) {
                currentToolCall = {
                  id: toolCall.id,
                  name: toolCall.function.name,
                  arguments: toolCall.function.arguments || ""
                };
              } else if (toolCall.function?.arguments && currentToolCall) {
                currentToolCall.arguments += toolCall.function.arguments;
              }
            }
            
            // Handle completion of tool call
            if (parsed.choices?.[0]?.finish_reason === "tool_calls" && currentToolCall) {
              toolCalls.push(currentToolCall);
              const args = JSON.parse(currentToolCall.arguments);
              
              // Handle strategy recommendation
              if (currentToolCall.name === "recommend_daily_strategy" && onStrategyReceived) {
                const strategy: FocusStrategy = {
                  name: args.strategyName,
                  workDuration: args.workMinutes * 60,
                  breakDuration: args.breakMinutes * 60,
                  description: args.description,
                  technique: args.technique,
                };
                onStrategyReceived(strategy);
              }
              
              const functionResult = formatToolCallResult(currentToolCall.name, args);
              
              assistantContent += functionResult;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return [
                    ...prev.slice(0, -1),
                    { role: "assistant", content: assistantContent },
                  ];
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
            
            // Handle regular content
            const content = delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return [
                    ...prev.slice(0, -1),
                    { role: "assistant", content: assistantContent },
                  ];
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Focus Assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatToolCallResult = (functionName: string, args: any): string => {
    switch (functionName) {
      case "break_down_task":
        return `\n\n**Task Breakdown: ${args.task}**\n\n` +
          args.subtasks.map((st: any, i: number) => 
            `${i + 1}. ${st.step} (${st.estimatedMinutes} min)`
          ).join("\n") + "\n\n";
      
      case "suggest_focus_technique":
        return `\n\n**Recommended Technique: ${args.technique.toUpperCase()}**\n\n` +
          `**Why?** ${args.reason}\n\n` +
          `**How to apply:** ${args.howToApply}\n\n`;
      
      case "estimate_task_duration":
        return `\n\n**Time Estimate for: ${args.task}**\n\n` +
          `⏱️ Estimated time: ${args.estimatedMinutes} minutes\n` +
          `🍅 Pomodoro sessions: ${args.pomodoroSessions}\n` +
          `📊 Confidence: ${args.confidence}\n\n` +
          `**Key factors:**\n` +
          args.factors.map((f: string) => `• ${f}`).join("\n") + "\n\n";
      
      case "recommend_break_timing":
        const emoji = {
          "take-break-now": "⏸️",
          "continue-working": "🎯",
          "short-break-soon": "⏰",
          "long-break-needed": "🌟"
        }[args.recommendation] || "💡";
        
        return `\n\n${emoji} **Break Recommendation**\n\n` +
          `${args.reasoning}\n\n` +
          `**Suggested break activity:** ${args.breakActivity}\n\n`;
      
      case "recommend_daily_strategy":
        return `\n\n🎯 **${args.strategyName}**\n\n` +
          `⏱️ Work/Break: ${args.workMinutes}/${args.breakMinutes} minutes\n\n` +
          `${args.description}\n\n` +
          `💡 **Technique:** ${args.technique}\n\n` +
          `✅ Your timer has been automatically set to these intervals!`;
      
      default:
        return "";
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    streamChat(message);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput("");
    streamChat(prompt);
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Focus Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tell me what you need to work on, and I'll create the perfect focus strategy for you!
            </p>
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt("I need to do deep research for a project")}
                className="justify-start text-left h-auto py-2"
              >
                🔬 Deep research work
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt("I'm coding a new feature")}
                className="justify-start text-left h-auto py-2"
              >
                💻 Coding session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt("I need to study for an exam tomorrow")}
                className="justify-start text-left h-auto py-2"
              >
                📚 Exam preparation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt("I have creative writing to do")}
                className="justify-start text-left h-auto py-2"
              >
                ✍️ Creative work
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-64 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Tell me what you need to work on..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusAssistant;
