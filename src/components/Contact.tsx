import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Mail, MessageCircle, Send } from "lucide-react";

const Contact = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Welcome aboard! 🎉",
      description: "You've successfully subscribed to our productivity newsletter.",
    });
    
    setEmail("");
    setIsSubmitting(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent! ✨",
      description: "Thanks for reaching out. We'll get back to you within 24 hours.",
    });
    
    setMessage("");
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Stay Connected
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get weekly productivity tips delivered to your inbox and never miss an update
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Newsletter Subscription */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300 w-fit">
                <Mail className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-300" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                Weekly Productivity Newsletter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Latest productivity tips and strategies</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                  <span>Tool recommendations and reviews</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                  <span>Exclusive student success stories</span>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-border/50 focus:border-primary/50 transition-colors duration-300"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe Now"}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground text-center">
                No spam, unsubscribe anytime. We respect your privacy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-accent/10 to-secondary/10 group-hover:from-accent/20 group-hover:to-secondary/20 transition-all duration-300 w-fit">
                <MessageCircle className="w-8 h-8 text-accent group-hover:text-secondary transition-colors duration-300" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-center">
                Have questions, suggestions, or want to share your productivity wins? 
                We'd love to hear from you!
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Textarea
                  placeholder="Tell us what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="border-border/50 focus:border-accent/50 transition-colors duration-300"
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-border/50">
          <p className="text-muted-foreground">
            © 2024 Boost Your Day. Made with 💙 for productive students everywhere.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;