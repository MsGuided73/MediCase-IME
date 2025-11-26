import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, PlusCircle, BookOpen, User, Stethoscope, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  isMain?: boolean;
  external?: boolean;
}

export const MobileBottomNav: React.FC = () => {
  const [location] = useLocation();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: 'Home'
    },
    {
      href: '/symptoms',
      icon: <Stethoscope className="h-5 w-5" />,
      label: 'Track'
    },
    {
      href: '/symptoms/new',
      icon: <PlusCircle className="h-7 w-7" />,
      label: 'New',
      isMain: true
    },
    {
      href: '/health-insights',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Learn'
    },
    {
      href: '/nutrition',
      icon: <FolderOpen className="h-5 w-5" />,
      label: 'Nutrition'
    },
    {
      href: '/profile',
      icon: <User className="h-5 w-5" />,
      label: 'Profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-padding">
      <div className="grid grid-cols-6 h-20 px-2">
        {navItems.map((item) => {
          const isActive = !item.external && (location === item.href || 
            (item.href !== '/dashboard' && location.startsWith(item.href)));
          
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center justify-center h-full touch-target relative",
                  "transition-all duration-200 rounded-xl mx-1 hover:scale-105",
                  "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                )}
              >
                <div className="transition-all duration-200 p-2 hover:scale-110">
                  {item.icon}
                </div>
                <span className="text-xs mt-1 font-medium">
                  {item.label}
                </span>
              </a>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full touch-target relative cursor-pointer",
                  "transition-all duration-200 rounded-xl mx-1",
                  isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50",
                  item.isMain && "relative -mt-4"
                )}
              >
                {item.isMain ? (
                  <div className={cn(
                    "rounded-full p-4 transition-all duration-200 shadow-lg",
                    isActive 
                      ? "bg-secondary text-secondary-foreground scale-110" 
                      : "bg-primary text-primary-foreground hover:scale-105"
                  )}>
                    {item.icon}
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "transition-all duration-200 p-2",
                      isActive && "scale-110"
                    )}>
                      {item.icon}
                    </div>
                    <span className={cn(
                      "text-xs mt-1 font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </>
                )}
                {isActive && !item.isMain && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
};