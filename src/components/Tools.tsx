import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Calendar, 
  FileText, 
  Timer, 
  Brain, 
  CheckSquare,
  ExternalLink
} from "lucide-react";

const tools = [
  {
    icon: Timer,
    name: "Forest",
    category: "Focus",
    description: "Stay focused and build healthy phone usage habits with this gamified pomodoro timer.",
    features: ["Pomodoro Timer", "Phone Blocking", "Tree Planting"],
    color: "bg-green-100 text-green-800"
  },
  {
    icon: CheckSquare,
    name: "Todoist",
    category: "Task Management", 
    description: "Organize your tasks and projects with natural language scheduling and collaboration features.",
    features: ["Natural Language", "Project Templates", "Team Collaboration"],
    color: "bg-red-100 text-red-800"
  },
  {
    icon: FileText,
    name: "Notion",
    category: "Note-Taking",
    description: "All-in-one workspace for notes, databases, wikis, and project management.",
    features: ["Databases", "Templates", "Team Workspaces"],
    color: "bg-gray-100 text-gray-800"
  },
  {
    icon: Calendar,
    name: "Google Calendar",
    category: "Scheduling",
    description: "Smart scheduling with time insights and seamless integration across all your devices.",
    features: ["Time Insights", "Smart Scheduling", "Multiple Calendars"],
    color: "bg-blue-100 text-blue-800"
  },
  {
    icon: Brain,
    name: "Anki",
    category: "Learning",
    description: "Powerful spaced repetition flashcard system that helps you remember anything efficiently.",
    features: ["Spaced Repetition", "Custom Cards", "Progress Tracking"],
    color: "bg-purple-100 text-purple-800"
  },
  {
    icon: Smartphone,
    name: "RescueTime",
    category: "Time Tracking",
    description: "Automatic time tracking that shows exactly how you spend your time and helps you focus.",
    features: ["Automatic Tracking", "Detailed Reports", "Website Blocking"],
    color: "bg-indigo-100 text-indigo-800"
  }
];

const Tools = () => {
  return (
    <section id="tools" className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Essential Productivity Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Curated apps and resources that successful students and professionals swear by
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/30 bg-card/90 backdrop-blur-sm overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                      <tool.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors duration-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {tool.name}
                      </CardTitle>
                      <Badge className={`mt-1 ${tool.color} border-0`}>
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature, featureIndex) => (
                    <span 
                      key={featureIndex}
                      className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-primary hover:text-accent border border-primary/20 hover:border-accent/30 transition-all duration-300"
                  variant="outline"
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tools;