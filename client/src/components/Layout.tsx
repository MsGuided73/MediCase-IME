import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Heart,
  Bell,
  LogOut
} from "lucide-react";
import { getUserInitials } from "@/utils/userUtils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Don't show navigation on auth pages
  const isAuthPage = location === "/login" || location === "/register";

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };



  if (isAuthPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MedicalDisclaimer />
      
      {/* Mobile-First Header - Simplified and Calming */}
      <header className="bg-card border-b border-border sticky top-0 z-40 safe-area-padding">
        <div className="flex justify-between items-center h-16 px-4 md:px-6">
          {/* Logo - Simplified for mobile */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="md:block hidden">
              <h1 className="text-lg font-semibold text-foreground">Sherlock Health</h1>
              <p className="text-xs text-muted-foreground">Your health companion</p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative touch-target rounded-full"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
            </Button>
            
            {/* User Avatar */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/profile")}
                className="touch-target rounded-full"
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-accent text-accent-foreground font-medium"
                )}>
                  {getUserInitials(user)}
                </div>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 safe-area-padding animate-fade-in",
        "pb-24 md:pb-8 md:ml-64" // Extra padding for mobile bottom nav and desktop sidebar
      )}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Only on mobile */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      {/* Desktop Side Navigation - Only on larger screens */}
      <div className="hidden md:block fixed left-0 top-16 w-64 h-full bg-card border-r border-border p-4 z-30">
        <nav className="space-y-2">
          <Button
            variant={location === "/dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/dashboard")}
          >
            <Heart className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={location.startsWith("/symptoms") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/symptoms")}
          >
            Symptom Tracking
          </Button>
          <Button
            variant={location === "/prescriptions" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/prescriptions")}
          >
            Medications
          </Button>
          <Button
            variant={location === "/health-insights" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/health-insights")}
          >
            Health Insights
          </Button>
        </nav>
        
        {/* Logout at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
