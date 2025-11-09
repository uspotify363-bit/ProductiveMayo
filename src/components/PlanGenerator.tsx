import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Wand2, 
  Target, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  CheckCircle2,
  Plus,
  Download,
  Share
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const PlanGenerator = () => {
  const { toast } = useToast();
  const [planType, setPlanType] = useState("");
  const [goal, setGoal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [details, setDetails] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const planTypes = [
    { value: "exam", label: "Exam Preparation", icon: BookOpen },
    { value: "project", label: "Project Completion", icon: Target },
    { value: "skill", label: "Skill Development", icon: Wand2 },
    { value: "habit", label: "Habit Formation", icon: CheckCircle2 },
    { value: "fitness", label: "Fitness Goal", icon: Target },
    { value: "learning", label: "Course/Learning Path", icon: BookOpen }
  ];

  const samplePlan = {
    title: "React Certification Preparation",
    duration: "8 weeks",
    totalHours: 120,
    phases: [
      {
        title: "Foundation Phase",
        duration: "2 weeks",
        tasks: [
          { task: "Review JavaScript fundamentals", hours: 8, priority: "high" },
          { task: "Complete React basics tutorial", hours: 12, priority: "high" },
          { task: "Build first React app", hours: 6, priority: "medium" },
          { task: "Learn JSX and components", hours: 8, priority: "high" }
        ]
      },
      {
        title: "Intermediate Phase",
        duration: "3 weeks",
        tasks: [
          { task: "Master hooks and state management", hours: 15, priority: "high" },
          { task: "Learn React Router", hours: 8, priority: "medium" },
          { task: "Practice with forms and validation", hours: 10, priority: "medium" },
          { task: "Build portfolio project", hours: 20, priority: "high" }
        ]
      },
      {
        title: "Advanced & Review Phase",
        duration: "3 weeks",
        tasks: [
          { task: "Advanced patterns and optimization", hours: 12, priority: "high" },
          { task: "Testing with Jest and RTL", hours: 10, priority: "medium" },
          { task: "Mock exams and practice tests", hours: 15, priority: "high" },
          { task: "Final project and review", hours: 16, priority: "high" }
        ]
      }
    ]
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const PLAN_URL = `https://iukdhujfycckpedlotvr.supabase.co/functions/v1/plan-generator`;
      
      const response = await fetch(PLAN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType,
          goal,
          timeline,
          details,
          deadline: deadline?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      
      toast({
        title: "Success",
        description: "Your personalized plan has been generated!",
      });
    } catch (error) {
      console.error("Plan generation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'bg-destructive/20 text-destructive' :
           priority === 'medium' ? 'bg-warning/20 text-warning' :
           'bg-success/20 text-success';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">AI Plan Generator</h2>
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <Wand2 className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Creation Form */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Create New Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  {planTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Goal Description</Label>
              <Input
                id="goal"
                placeholder="e.g., Pass React certification exam"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2weeks">2 weeks</SelectItem>
                  <SelectItem value="1month">1 month</SelectItem>
                  <SelectItem value="2months">2 months</SelectItem>
                  <SelectItem value="3months">3 months</SelectItem>
                  <SelectItem value="6months">6 months</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea
                id="details"
                placeholder="Any specific requirements, preferences, or constraints..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !goal || !planType}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Plan...
                </div>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate AI Plan
                </>
              )}
            </Button>

            {/* Quick Templates */}
            <div className="pt-4 border-t border-border/50">
              <Label className="text-sm font-medium mb-3 block">Quick Templates</Label>
              <div className="space-y-2">
                {["Exam in 2 months", "Learn new skill", "30-day habit"].map((template, index) => (
                  <Button key={index} variant="ghost" size="sm" className="w-full justify-start text-left">
                    <Plus className="w-4 h-4 mr-2" />
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Plan Display */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Generated Plan
              </CardTitle>
              {generatedPlan && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generatedPlan ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto bg-muted/30 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Create Your Plan?</h3>
                <p className="text-muted-foreground">
                  Fill out the form to generate a personalized, AI-optimized plan for your goal.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Plan Overview */}
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-6 border border-primary/10">
                  <h3 className="text-xl font-bold text-foreground mb-4">{generatedPlan.title}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{generatedPlan.duration}</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{generatedPlan.totalHours}h</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{generatedPlan.phases.length}</div>
                      <div className="text-sm text-muted-foreground">Phases</div>
                    </div>
                  </div>
                </div>

                {/* Plan Phases */}
                <div className="space-y-4">
                  {generatedPlan.phases.map((phase: any, phaseIndex: number) => (
                    <Card key={phaseIndex} className="border border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{phase.title}</CardTitle>
                          <Badge variant="outline">{phase.duration}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {phase.tasks.map((task: any, taskIndex: number) => (
                            <div key={taskIndex} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{task.task}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {task.hours}h
                                  </span>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) {
                          toast({
                            title: "Error",
                            description: "You must be logged in to save plans",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Save plan
                        await supabase.from('plans').insert({
                          user_id: user.id,
                          type: planType,
                          goal,
                          timeline,
                          details,
                          deadline: deadline?.toISOString(),
                          title: generatedPlan.title,
                          content: generatedPlan
                        });

                        // Create tasks in calendar from plan phases
                        const tasks: any[] = [];
                        if (generatedPlan.phases) {
                          // Use deadline if provided, otherwise calculate from timeline
                          const startDate = new Date();
                          let endDate = deadline ? new Date(deadline) : new Date();
                          
                          if (!deadline) {
                            // Calculate end date from timeline if no deadline is set
                            const timelineMap: Record<string, number> = {
                              '2weeks': 14,
                              '1month': 30,
                              '2months': 60,
                              '3months': 90,
                              '6months': 180,
                              '1year': 365
                            };
                            const days = timelineMap[timeline] || 30;
                            endDate.setDate(startDate.getDate() + days);
                          }
                          
                          const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                          
                          let dayOffset = 0;
                          generatedPlan.phases.forEach((phase: any) => {
                            phase.tasks.forEach((task: any, index: number) => {
                              const taskDate = new Date(startDate);
                              taskDate.setDate(startDate.getDate() + dayOffset);
                              taskDate.setHours(9, 0, 0, 0);
                              
                              const endTime = new Date(taskDate);
                              endTime.setHours(9 + Math.ceil(task.hours || 1), 0, 0, 0);

                              tasks.push({
                                user_id: user.id,
                                title: task.task,
                                description: `${phase.title} - ${generatedPlan.title}`,
                                type: planType === 'fitness' ? 'personal' : 'work',
                                start_time: taskDate.toISOString(),
                                end_time: endTime.toISOString(),
                                completed: false
                              });

                              dayOffset += Math.ceil(totalDays / (generatedPlan.phases.length * 4));
                            });
                          });

                          if (tasks.length > 0) {
                            await supabase.from('tasks').insert(tasks);
                          }
                        }

                        toast({
                          title: "Success",
                          description: `Plan saved and ${tasks.length} tasks added to calendar!`,
                        });
                      } catch (error) {
                        console.error('Error saving plan:', error);
                        toast({
                          title: "Error",
                          description: "Failed to save plan",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Save Plan & Add to Calendar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Customize Plan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanGenerator;