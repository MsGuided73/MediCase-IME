import { useLocation, Link } from "wouter";

export default function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          <Link href="/">
            <button className={`flex flex-col items-center p-2 ${isActive("/") ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              <i className="fas fa-home text-lg mb-1"></i>
              <span className="text-xs font-medium">Home</span>
            </button>
          </Link>
          
          <Link href="/symptoms">
            <button className={`flex flex-col items-center p-2 ${isActive("/symptoms") ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              <i className="fas fa-notes-medical text-lg mb-1"></i>
              <span className="text-xs">Symptoms</span>
            </button>
          </Link>
          
          <Link href="/medications">
            <button className={`flex flex-col items-center p-2 ${isActive("/medications") ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              <i className="fas fa-pills text-lg mb-1"></i>
              <span className="text-xs">Medications</span>
            </button>
          </Link>
          
          <Link href="/insights">
            <button className={`flex flex-col items-center p-2 ${location === "/insights" ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              <i className="fas fa-chart-bar text-lg mb-1"></i>
              <span className="text-xs">Insights</span>
            </button>
          </Link>
          
          <Link href="/profile">
            <button className={`flex flex-col items-center p-2 ${isActive("/profile") ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}>
              <i className="fas fa-user text-lg mb-1"></i>
              <span className="text-xs">Profile</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
