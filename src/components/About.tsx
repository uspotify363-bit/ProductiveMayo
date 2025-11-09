import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Lightbulb, TrendingUp } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Purpose-Driven",
      description: "We believe productivity isn't about being busy—it's about making meaningful progress toward your goals."
    },
    {
      icon: Users,
      title: "Student-Focused", 
      description: "Our content is specifically designed for students and young professionals navigating academic and career challenges."
    },
    {
      icon: Lightbulb,
      title: "Evidence-Based",
      description: "Every tip and recommendation is backed by research and proven to work in real-world situations."
    },
    {
      icon: TrendingUp,
      title: "Growth-Oriented",
      description: "We focus on sustainable habits that compound over time, not quick fixes that fade away."
    }
  ];

  return (
    <section id="about" className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Boost Your Day
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're on a mission to help students and young professionals unlock their potential 
              through smarter productivity strategies. In a world full of distractions and competing 
              priorities, we provide the tools and insights you need to focus on what truly matters.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our approach combines proven productivity principles with modern tools and techniques. 
              Whether you're studying for exams, starting your career, or working on side projects, 
              we're here to help you make every day count.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/80 backdrop-blur-sm"
            >
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 w-fit">
                  <value.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/10">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Join Thousands of Productive Students
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Since launching, we've helped over 10,000 students and young professionals 
            develop better habits, improve their focus, and achieve their academic and career goals. 
            Your productivity journey starts here.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;