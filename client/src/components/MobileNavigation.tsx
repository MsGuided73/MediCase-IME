import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Thermometer, 
  PillBottle, 
  TrendingUp, 
  User 
} from "lucide-react";

export default function MobileNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      path: "/",
      icon: Home,
      label: "Home",
    },
    {
      path: "/symptoms",
      icon: Thermometer,
      label: "Symptoms",
    },
    {
      path: "/prescriptions",
      icon: PillBottle,
      label: "Meds",
    },
    {
      path: "/insights",
      icon: TrendingUp,
      label: "Insights",
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <IconComponent className="text-lg" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
