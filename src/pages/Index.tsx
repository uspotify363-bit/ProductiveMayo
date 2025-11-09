import { useState, useEffect } from "react";
import Auth from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setActiveModule("dashboard");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        
        if (session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata?.name || "Productivity User",
            email: session.user.email,
            level: 1,
            points: 0,
            streak: 0
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
      setSession(session);
      
      if (session?.user) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.name || "Productivity User",
          email: session.user.email,
          level: 1,
          points: 0,
          streak: 0
        };
        setUser(userData);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log("Rendering Index with isLoading:", isLoading, "user:", user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("Rendering Auth component");
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  console.log("Rendering Dashboard component");
  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout}
      activeModule={activeModule}
      setActiveModule={setActiveModule}
    />
  );
};

export default Index;
