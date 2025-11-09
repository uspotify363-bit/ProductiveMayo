import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Target, 
  Heart,
  Brain,
  Zap,
  TrendingUp
} from "lucide-react";

const AICoach = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi there! I'm your AI productivity coach. I'm here to help you overcome challenges, stay motivated, and optimize your workflow. What's on your mind today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: "I'm feeling unmotivated", icon: Heart, color: "bg-destructive/10 text-destructive" },
    { label: "Help me focus better", icon: Brain, color: "bg-primary/10 text-primary" },
    { label: "Overcome procrastination", icon: Zap, color: "bg-accent/10 text-accent" },
    { label: "Set better goals", icon: Target, color: "bg-secondary/10 text-secondary" },
    { label: "Improve my workflow", icon: TrendingUp, color: "bg-success/10 text-success" },
    { label: "Time management tips", icon: Lightbulb, color: "bg-warning/10 text-warning" }
  ];

  const sampleResponses = [
    "I understand you're feeling unmotivated. Let's break this down - what specific task or goal is causing you difficulty? Sometimes the key is starting with just 5 minutes of focused work.",
    "Great question about focus! Based on your productivity patterns, I notice you work best in 25-minute blocks. Have you tried the Pomodoro technique with background nature sounds?",
    "Procrastination often stems from perfectionism or overwhelm. Let's make your next task so small that it feels impossible to fail. What's one tiny step you can take right now?",
    "I love that you want to improve your goal-setting! The most effective goals are specific, measurable, and time-bound. What's one outcome you'd like to achieve this week?",
    "Workflow optimization is my specialty! Looking at your data, you're most productive between 9-11 AM. Are you scheduling your most important tasks during this golden window?",
    "Time management is all about energy management. Instead of trying to do everything, focus on your 3 most important tasks each day. Quality over quantity always wins!"
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const CHAT_URL = `https://iukdhujfycckpedlotvr.supabase.co/functions/v1/ai-coach`;
      
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add assistant message placeholder
      const assistantMessageId = messages.length + 2;
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        type: 'bot' as const,
        content: "",
        timestamp: new Date()
      }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: assistantContent }
                  : msg
              ));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error("AI Coach error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">AI Productivity Coach</h2>
          <Badge className="bg-success/10 text-success border-success/20">
            <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
            Online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Productivity Coach</div>
                <div className="text-sm text-muted-foreground font-normal">Your personal AI mentor</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-gradient-to-br from-accent to-secondary text-white'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-muted/50 text-foreground'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted/50 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border/50 p-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Ask me about productivity, motivation, or time management..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAction(action.label)}
                  className="w-full justify-start text-left h-auto p-3"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mr-3`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Today's Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">Peak Performance</p>
                <p className="text-xs text-muted-foreground">You're most focused at 10 AM. Schedule important tasks then!</p>
              </div>
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <p className="text-sm font-medium text-success">Great Progress</p>
                <p className="text-xs text-muted-foreground">You've completed 85% of your weekly goals. Keep it up!</p>
              </div>
              <div className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                <p className="text-sm font-medium text-warning">Break Reminder</p>
                <p className="text-xs text-muted-foreground">You've been working for 2 hours. Time for a break!</p>
              </div>
            </CardContent>
          </Card>

          {/* Coach Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Coaching Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">127</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">94%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">23</div>
                <div className="text-sm text-muted-foreground">Days Coached</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AICoach;