import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  Target, 
  Brain, 
  Zap, 
  Calendar, 
  Coffee,
  CheckCircle,
  Focus
} from "lucide-react";

const tips = [
  {
    icon: Clock,
    title: "Time Blocking",
    description: "Schedule specific time slots for different tasks. This prevents multitasking and helps you focus on one thing at a time."
  },
  {
    icon: Target,
    title: "Set 3 Daily Goals",
    description: "Choose just 3 important tasks each morning. Completing fewer tasks well is better than starting many and finishing none."
  },
  {
    icon: Brain,
    title: "The 2-Minute Rule",
    description: "If something takes less than 2 minutes, do it immediately. This prevents small tasks from piling up into overwhelming lists."
  },
  {
    icon: Zap,
    title: "Energy Management",
    description: "Schedule demanding work during your peak energy hours. Save routine tasks for when your energy naturally dips."
  },
  {
    icon: Calendar,
    title: "Weekly Planning",
    description: "Spend 15 minutes every Sunday planning your week. Having a clear roadmap reduces daily decision fatigue."
  },
  {
    icon: Coffee,
    title: "Morning Routine",
    description: "Start each day with 3 consistent activities that energize you. A strong morning sets the tone for productivity."
  },
  {
    icon: CheckCircle,
    title: "Done Lists",
    description: "Keep track of what you've accomplished, not just what's left to do. Celebrating progress maintains motivation."
  },
  {
    icon: Focus,
    title: "Single-Tasking",
    description: "Focus on one task completely before moving to the next. Your brain works more efficiently with undivided attention."
  }
];

const Tips = () => {
  return (
    <section id="tips" className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Daily Productivity Tips
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, science-backed habits that will transform how you work and study
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/20 bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 w-fit">
                  <tip.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {tip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {tip.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tips;