import { useState, useEffect } from "react";
import { 
  User, 
  Truck, 
  Package, 
  Calendar, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    { id: "loading", label: "Loading Sheet", icon: FileText },
    { id: "upcoming", label: "Upcoming", icon: Calendar },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "abstract", label: "Abstract Daily Booking", icon: FileText },
    { id: "invoice", label: "Invoice", icon: FileText },
    { id: "search", label: "In Search", icon: Package }
  ];

  const adminTabs = [
    { id: "add-agent", label: "Add Agent", icon: User },
    { id: "manage-agents", label: "Manage Agents", icon: User },
    { id: "master-data", label: "Master Data", icon: FileText },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "overview", label: "Overview", icon: BarChart3 }
  ];

  const tabs = userRole === "admin" ? adminTabs : navigationTabs;

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 shadow-sm min-h-screen flex flex-col transition-all duration-300 ease-in-out`}>
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} flex-1 flex flex-col`}>
        {/* Toggle Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Brand Header */}
        <div className={`${isCollapsed ? 'text-center' : 'text-center'} mb-6`}>
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md relative">
              {/* Custom container-only truck icon */}
              <div className="w-8 h-6 bg-white rounded-sm relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-blue-600 font-bold">BLS</span>
                </div>
              </div>
            </div>
          </div>
          {!isCollapsed && (
            <>
              <h1 className="text-lg font-bold text-gray-800">BALAJI LORRY SERVICE</h1>
              <p className="text-xs text-gray-500">Logistics Management System</p>
              <p className="text-xs text-gray-400 mt-1">on track on time</p>
            </>
          )}
        </div>

        {/* User Info */}
        <div className={`mb-6 ${isCollapsed ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg`}>
          {user && (
            <div className={`${isCollapsed ? 'text-center' : 'text-sm'}`}>
              {!isCollapsed ? (
                <>
                  <span className="text-gray-600">welcome</span>
                  <span className="ml-1 font-semibold text-gray-800">{user.name}</span>
                </>
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Auto-collapse sidebar when Reports is clicked
                  if (tab.id === "reports") {
                    setIsCollapsed(true);
                    localStorage.setItem('sidebar_collapsed', 'true');
                  } else {
                    // Auto-expand sidebar for other tabs for better navigation
                    if (isCollapsed) {
                      setIsCollapsed(false);
                      localStorage.setItem('sidebar_collapsed', 'false');
                    }
                  }
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={isCollapsed ? tab.label : ""}
              >
                <IconComponent className="w-4 h-4" />
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    <span>{tab.label}</span>
                    {tab.id === "reports" && (
                      <Info className="w-3 h-3 text-blue-500" title="Auto-collapses sidebar for better view" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="pt-4 border-t border-gray-200 mt-auto">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className={`${isCollapsed ? 'w-8 h-8 p-0' : 'w-full h-8'} text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-3 h-3" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

