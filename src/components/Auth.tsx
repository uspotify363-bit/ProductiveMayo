import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters")
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters")
});

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const schema = isLogin ? loginSchema : signupSchema;
      const validationResult = schema.safeParse(formData);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      if (isLogin) {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please check your credentials and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Error",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        if (data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.user_metadata?.name || "Productivity User",
            email: data.user.email,
            level: 1,
            points: 0,
            streak: 0
          };

          toast({
            title: "Welcome back! 🎉",
            description: "Ready to boost your productivity?",
          });
          
          onAuthSuccess(userData);
        }
      } else {
        // Sign up new user
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Account Exists",
              description: "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup Error",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        if (data.user) {
          // Check if email confirmation is needed
          if (!data.session) {
            toast({
              title: "Check Your Email! 📧",
              description: "We've sent you a confirmation link. Please check your email to complete signup.",
            });
          } else {
            const userData = {
              id: data.user.id,
              name: formData.name,
              email: data.user.email,
              level: 1,
              points: 0,
              streak: 0
            };

            toast({
              title: "Account created! 🚀",
              description: "Let's start your productivity journey!",
            });
            
            onAuthSuccess(userData);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.name || "Productivity User",
          email: session.user.email,
          level: 1,
          points: 0,
          streak: 0
        };
        onAuthSuccess(userData);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.name || "Productivity User",
            email: session.user.email,
            level: 1,
            points: 0,
            streak: 0
          };
          onAuthSuccess(userData);
        }
      }
    );

    checkSession();

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Productivity Hub
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back! Ready to boost your day?" : "Join thousands boosting their productivity"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 border-border/50 focus:border-primary/50 transition-colors"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl h-12"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </div>
                ) : (
                  <span className="font-medium">
                    {isLogin ? "Sign In" : "Create Account"}
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="font-medium text-primary">
                  {isLogin ? "Sign Up" : "Sign In"}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="text-center text-sm text-muted-foreground">
          <p>✨ Smart Calendar • ⏰ Time Tracking • 📊 Analytics • 🤖 AI Coach</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;