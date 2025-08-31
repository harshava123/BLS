import { useState, useEffect } from "react";
import { 
  User, 
  Truck, 
  Package, 
  Calendar, 
  FileText, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar({ activeTab, setActiveTab, userRole = "agent" }) {
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      setUser(JSON.parse(authUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    window.location.href = "/";
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  const navigationTabs = [
    { id: "booking", label: "Booking", icon: Package },
    { id: "location-bookings", label: "Location Bookings", icon: FileText },
    // { id: "reports", label: "Reports", icon: BarChart3 },
    // { id: "loading", label: "Loading Sheet", icon: FileText },
    // { id: "upcoming", label: "Upcoming", icon: Calendar },
    // { id: "delivery", label: "Delivery", icon: Truck },
    // { id: "abstract", label: "Abstract Daily Booking", icon: FileText },
    // { id: "invoice", label: "Invoice", icon: FileText },
    // { id: "search", label: "In Search", icon: Package }
  ];

  const adminTabs = [
    { id: "add-agent", label: "Add Agent", icon: User },
    { id: "manage-agents", label: "Manage Agents", icon: User },
    { id: "master-data", label: "Master Data", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 }
  ];

  const tabs = userRole === "admin" ? adminTabs : navigationTabs;

  return (
    <div className={cn(
      "flex h-screen border-r border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex w-full flex-col gap-2">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-gray-200 px-2">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">BLS</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">BALAJI LORRY SERVICE</span>
                <span className="text-xs text-gray-500">Logistics System</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="ml-auto h-8 w-8 p-0 hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Welcome */}
        {user && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Welcome</span>
                  <span className="text-sm font-medium text-gray-800">{user.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="grid gap-1 px-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "justify-start h-9 px-2",
                  isActive 
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "h-9 w-9 p-0"
                )}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "reports" || tab.id === "location-bookings") {
                    setIsCollapsed(true);
                    localStorage.setItem('sidebar_collapsed', 'true');
                  } else if (isCollapsed) {
                    setIsCollapsed(false);
                    localStorage.setItem('sidebar_collapsed', 'false');
                  }
                }}
              >
                <IconComponent className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="ml-2 text-sm font-medium">{tab.label}</span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400",
              isCollapsed && "h-9 w-9 p-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

