import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Truck, Search, User, Settings, LogOut, LogIn, Clock } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      setUser(JSON.parse(authUser));
    }

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    
    // Update user state
    setUser(null);
    
    // Show feedback to user
    alert("Logged out successfully!");
    
    // Redirect to login page
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Company Branding */}
          <div className="flex items-center gap-6">
            {/* Company Logo & Name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  BALAJI LORRY SERVICE
                </h1>
                <p className="text-xs text-gray-500">on track on time</p>
              </div>
            </div>
          </div>

          {/* Center - Time and Search */}
          <div className="flex items-center gap-6">
            {/* Time Display */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{currentTime}</span>
            </div>

            {/* Search Bar */}
            {/* d */}
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">welcome</span>
                    <span className="ml-1 font-semibold text-gray-800">{user.name}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  LOGOUT
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-500">Not logged in</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/")}
                  className="h-7 px-3 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  LOGIN
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
