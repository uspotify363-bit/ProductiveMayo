import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import heroImage from "@/assets/hero-productivity.jpg";

const Hero = () => {
  const scrollToTips = () => {
    document.getElementById('tips')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src={heroImage} 
          alt="Clean, organized workspace with laptop and productivity tools"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
            Boost Your Day
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-foreground/80 font-light max-w-2xl mx-auto">
            Get More Done Every Day
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Discover practical tips, powerful tools, and daily habits that help students 
            and young professionals maximize their productivity and achieve their goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              onClick={scrollToTips}
            >
              Start Boosting Now
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown 
            className="w-8 h-8 text-primary cursor-pointer hover:text-accent transition-colors duration-300" 
            onClick={scrollToTips}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;