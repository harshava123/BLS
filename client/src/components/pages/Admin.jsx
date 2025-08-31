
 import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import Sidebar from "@/components/layout/Sidebar";
import Reports from "@/components/pages/Reports";
import { API_BASE_URL } from "@/config";
import { User, Users, BarChart3, FileText, MapPin, Search } from "lucide-react";

export default function Admin() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("add-agent");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state for adding new agent
  const [newAgent, setNewAgent] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    role: "agent"
  });

  // Available locations - will be populated from master data
  const [locations, setLocations] = useState([]);

  // State for master data
  const [cities, setCities] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Form state for new entries
  const [newCity, setNewCity] = useState({ name: "", code: "" });
  const [newLocation, setNewLocation] = useState({ name: "", code: "", city_id: "", city_code: "", status: "active", address: "" });
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "", gst_number: "" });

  // Unified search state for master data
  const [masterDataSearch, setMasterDataSearch] = useState("");
  
  // Master data tab state
  const [masterDataTab, setMasterDataTab] = useState("add-city");
  
  // Edit states
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Search debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Modal states
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null, showCancel: false });

  // Fetch all agents
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        console.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all master data
  const fetchMasterData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching master data from:', `${API_BASE_URL}/api/master-data`);
      const response = await fetch(`${API_BASE_URL}/api/master-data`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Master data received:', data);
        console.log('🏙️ Cities count:', data.cities?.length || 0);
        console.log('📍 Locations count:', data.locations?.length || 0);
        console.log('👥 Customers count:', data.customers?.length || 0);
        
        setCities(data.cities || []);
        setLocationsData(data.locations || []);
        setCustomers(data.customers || []);
        
        // Set locations for agent creation form - combine name and code
        if (data.locations && data.locations.length > 0) {
          setLocations(data.locations.map(loc => `${loc.name} (${loc.code})`));
        }
      } else {
        console.error('❌ Failed to fetch master data:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Perform search across master data
  const performSearch = async (query) => {
    if (!query.trim()) {
      fetchMasterData(); // Show all data if search is empty
      return;
    }

    try {
      setLoading(true);
      console.log('Searching for:', query); // Debug log
      
      // First try the API search
      const response = await fetch(`${API_BASE_URL}/api/master-data?search=${encodeURIComponent(query)}`);
      console.log('Search response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Search results from API:', data); // Debug log
        
        setCities(data.cities || []);
        setLocationsData(data.locations || []);
        setCustomers(data.customers || []);
      } else {
        console.log('API search failed, falling back to client-side search');
        // Fallback to client-side search
        performClientSideSearch(query);
      }
    } catch (error) {
      console.error('Error performing API search:', error);
      console.log('Falling back to client-side search');
      // Fallback to client-side search
      performClientSideSearch(query);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to show modals
  const showModal = (title, message, type = "info", onConfirm = null, showCancel = false) => {
    setModal({ isOpen: true, title, message, type, onConfirm, showCancel });
  };

  const hideModal = () => {
    setModal({ isOpen: false, title: "", message: "", type: "info", onConfirm: null, showCancel: false });
  };

  const showConfirmModal = (title, message, onConfirm) => {
    showModal(title, message, "confirm", onConfirm, true);
  };

  // Client-side search fallback
  const performClientSideSearch = (query) => {
    console.log('Performing client-side search for:', query);
    
    // Get all data first if we don't have it
    if (cities.length === 0 && locationsData.length === 0 && customers.length === 0) {
      console.log('No data available for client-side search, fetching first...');
      fetchMasterData().then(() => {
        // After fetching, perform the search
        setTimeout(() => performClientSideSearch(query), 100);
      });
      return;
    }

    const searchTerm = query.toLowerCase();
    
    // Search in cities
    const filteredCities = cities.filter(city => 
      city.name.toLowerCase().includes(searchTerm) || 
      city.code.toLowerCase().includes(searchTerm)
    );
    
    // Search in locations
    const filteredLocations = locationsData.filter(location => 
      location.name.toLowerCase().includes(searchTerm) || 
      location.code.toLowerCase().includes(searchTerm) ||
      (location.city_code && location.city_code.toLowerCase().includes(searchTerm))
    );
    
    // Search in customers
    const filteredCustomers = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) || 
      customer.phone.includes(searchTerm) ||
      (customer.gst_number && customer.gst_number.toLowerCase().includes(searchTerm))
    );
    
    console.log('Client-side search results:', {
      cities: filteredCities.length,
      locations: filteredLocations.length,
      customers: filteredCustomers.length
    });
    
    setCities(filteredCities);
    setLocationsData(filteredLocations);
    setCustomers(filteredCustomers);
  };

  // Add new city
  const handleAddCity = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCity)
      });

      if (response.ok) {
        const result = await response.json();
        // Immediately update UI by adding the new city to state
        setCities(prevCities => [...prevCities, result]);
        showModal('Success', 'City added successfully!', 'success');
        setNewCity({ name: "", code: "" });
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error adding city:', error);
      showModal('Error', 'Error adding city', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add new location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      });

      if (response.ok) {
        const result = await response.json();
        // Immediately update UI by adding the new location to state
        setLocationsData(prevLocations => [...prevLocations, result]);
        // Also update the locations array for agent creation
        setLocations(prevLocations => [...prevLocations, `${result.name} (${result.code})`]);
        showModal('Success', 'Location added successfully!', 'success');
        setNewLocation({ name: "", code: "", city_id: "", city_code: "", status: "active", address: "" });
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      showModal('Error', 'Error adding location', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add new customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });

      if (response.ok) {
        const result = await response.json();
        // Immediately update UI by adding the new customer to state
        setCustomers(prevCustomers => [...prevCustomers, result]);
        showModal('Success', 'Customer added successfully!', 'success');
        setNewCustomer({ name: "", phone: "", address: "", gst_number: "" });
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      showModal('Error', 'Error adding customer', 'error');
    } finally {
      setLoading(false);
    }
  };





  // Edit customer
  const handleEditCustomer = async (customerId, updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        // Immediately update UI by updating the customer in state
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => 
            customer._id === customerId ? { ...customer, ...updatedData } : customer
          )
        );
        showModal('Success', 'Customer updated successfully!', 'success');
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showModal('Error', 'Error updating customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (customerId) => {
    showConfirmModal(
      'Delete Customer',
      'Are you sure you want to delete this customer? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            // Immediately update UI by removing the customer from state
            setCustomers(prevCustomers => prevCustomers.filter(customer => customer._id !== customerId));
            showModal('Success', 'Customer deleted successfully!', 'success');
          } else {
            const error = await response.json();
            showModal('Error', `Error: ${error.message}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting customer:', error);
          showModal('Error', 'Error deleting customer', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Add new agent
  const handleAddAgent = async (e) => {
    e.preventDefault();
    
    if (!newAgent.name || !newAgent.email || !newAgent.password || !newAgent.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (locations.length === 0) {
      showModal('Error', 'No locations available. Please add locations in Master Data first.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/create-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Agent added:', result);
        showModal('Success', 'Agent added successfully!', 'success');
        
        // Reset form
        setNewAgent({
          name: "",
          email: "",
          password: "",
          location: "",
          role: "agent"
        });
        
        // Refresh agents list
        fetchAgents();
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error adding agent:', error);
      showModal('Error', 'Error adding agent. Please check if the backend server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update agent status
  const handleToggleStatus = async (agentId, currentStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        // Immediately update UI by updating the agent status in state
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent._id === agentId 
              ? { ...agent, isActive: !currentStatus }
              : agent
          )
        );
        showModal('Success', `Agent ${currentStatus ? 'deactivated' : 'activated'} successfully!`, 'success');
      } else {
        const error = await response.json();
        showModal('Error', `Error updating agent status: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      showModal('Error', 'Error updating agent status. Please check if the backend server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete agent
  const handleDeleteAgent = async (agentId) => {
    showConfirmModal(
      'Delete Agent',
      'Are you sure you want to delete this agent? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/auth/agents/${agentId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            // Immediately update UI by removing the agent from state
            setAgents(prevAgents => prevAgents.filter(agent => agent._id !== agentId));
            showModal('Success', 'Agent deleted successfully!', 'success');
          } else {
            const error = await response.json();
            showModal('Error', `Error deleting agent: ${error.message || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting agent:', error);
          showModal('Error', 'Error deleting agent. Please check if the backend server is running.', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Load agents and master data on component mount
  useEffect(() => {
    fetchAgents();
    fetchMasterData();
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Debug: Log when cities state changes
  useEffect(() => {
    console.log('🏙️ Cities state updated:', cities);
    console.log('🏙️ Cities count:', cities.length);
    if (cities.length > 0) {
      console.log('🏙️ Sample city:', cities[0]);
    }
  }, [cities]);

    return (
    <div className="h-screen flex bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="admin" />
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage agents and system settings</p>
          </div>



        {/* Tab Content */}
        {activeTab === "add-agent" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Add New Agent</CardTitle>
              <CardDescription>
                Create a new agent account with location allocation. Agents are field operators with limited access to the system. Note: Agents cannot change their assigned location. 
                {locations.length === 0 && (
                  <span className="text-orange-600 font-medium block mt-1">
                    ⚠️ No locations available. Please add locations in Master Data first. 
                    <button 
                      type="button" 
                      onClick={() => setActiveTab("master-data")}
                      className="text-blue-600 hover:text-blue-800 underline ml-1"
                    >
                      Go to Master Data
                    </button>
                  </span>
                )}

              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAgent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Agent Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter agent name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newAgent.password}
                      onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Location *
                    </Label>
                    {locations.length === 0 ? (
                      <div className="mt-2">
                        <div className="h-10 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-500 flex items-center">
                          No locations available. Please add locations in Master Data first.
                        </div>
                      </div>
                    ) : (
                      <Select
                        value={newAgent.location}
                        onValueChange={(value) => setNewAgent({ ...newAgent, location: value })}
                        disabled={loading}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={
                            loading ? "Loading locations..." : 
                            "Select location"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Loading locations...
                            </div>
                          ) : (
                            locations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    
                  </div>

                      <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role
                    </Label>
                    <Input
                      id="role"
                      type="text"
                      value="Agent"
                      className="mt-2 bg-gray-100"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Agents are field operators with limited access
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                  >
                    {loading ? "Adding..." : "Add Agent"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "manage-agents" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Manage Agents</CardTitle>
                  <CardDescription>
                    View, edit, and manage existing agents. Location assignments are fixed and cannot be changed by agents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 text-gray-600 font-medium">Loading agents...</p>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No agents found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first agent above to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Agent
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {agents
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((agent) => (
                            <tr key={agent._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                              <td className="px-3 py-3">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                      {agent.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-semibold text-gray-900">{agent.name}</div>
                                    <div className="text-xs text-gray-500">ID: {agent._id.slice(-6)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-sm text-gray-900 truncate max-w-[180px]" title={agent.email}>
                                  {agent.email}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {agent.location.toUpperCase()}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  agent.isActive 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                                    agent.isActive ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  {agent.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-sm text-gray-900">
                                  {new Date(agent.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(agent.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant={agent.isActive ? "destructive" : "default"}
                                    onClick={() => handleToggleStatus(agent._id, agent.isActive)}
                                    className={`text-xs h-7 px-2 ${
                                      agent.isActive 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {agent.isActive ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteAgent(agent._id)}
                                    className="text-xs h-7 px-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {agents.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-2">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, agents.length)}
                        </span>{' '}
                        of <span className="font-medium">{agents.length}</span> results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-3"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.ceil(agents.length / itemsPerPage) }, (_, i) => i + 1)
                            .filter(page => {
                              const totalPages = Math.ceil(agents.length / itemsPerPage);
                              if (totalPages <= 7) return true;
                              if (page === 1 || page === totalPages) return true;
                              if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                              return false;
                            })
                            .map((page, index, array) => {
                              if (index > 0 && array[index - 1] !== page - 1) {
                                return (
                                  <span key={`ellipsis-${page}`} className="px-2 text-gray-500">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className={`h-8 w-8 p-0 ${
                                    currentPage === page 
                                      ? 'bg-blue-600 text-white' 
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </Button>
                              );
                            })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(agents.length / itemsPerPage)))}
                          disabled={currentPage === Math.ceil(agents.length / itemsPerPage)}
                          className="h-8 px-3"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "master-data" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Master Data Management</CardTitle>
                    <CardDescription>
                      Manage cities, locations, and customers in one centralized location
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search across all master data..."
                        value={masterDataSearch}
                        onChange={(e) => {
                          const query = e.target.value;
                          setMasterDataSearch(query);
                          
                          if (searchTimeout) {
                            clearTimeout(searchTimeout);
                          }
                          
                          const newTimeout = setTimeout(() => {
                            if (query.trim()) {
                              performSearch(query);
                            } else {
                              fetchMasterData();
                            }
                          }, 500);
                          
                          setSearchTimeout(newTimeout);
                        }}
                        className="w-full pl-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => performSearch(masterDataSearch)} 
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loading ? "Searching..." : "Search"}
                    </Button>
                    <Button 
                      onClick={fetchMasterData} 
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Refresh All
                    </Button>
                    <Button 
                      onClick={() => {
                        setMasterDataSearch("");
                        fetchMasterData();
                      }} 
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Master Data Tabs */}
            <Card>
              <CardHeader>
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-6">
                    {[
                      { id: "add-city", label: "Add New City", icon: "🏙️", color: "blue" },
                      { id: "add-location", label: "Add New Location", icon: "📍", color: "green" },
                      { id: "add-customer", label: "Add New Customer", icon: "👤", color: "purple" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMasterDataTab(tab.id)}
                        className={`py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
                          masterDataTab === tab.id
                            ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add New City Tab */}
                {masterDataTab === "add-city" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">🏙️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-blue-800">Add New City</h3>
                      </div>
                      <form onSubmit={handleAddCity} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cityName" className="text-sm font-semibold text-gray-700">City Name</Label>
                            <Input
                              id="cityName"
                              placeholder="Enter city name"
                              value={newCity.name}
                              onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cityCode" className="text-sm font-semibold text-gray-700">City Code (3 digits)</Label>
                            <Input
                              id="cityCode"
                              placeholder="e.g., HYD"
                              value={newCity.code}
                              onChange={(e) => setNewCity({...newCity, code: e.target.value.toUpperCase()})}
                              maxLength={3}
                              className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                        >
                          {loading ? "Adding..." : "Add City"}
                        </Button>
                      </form>
                    </div>

                    {/* Cities List */}
                    <div className="border-t pt-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🏙️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Existing Cities ({cities.length})</h3>
                      </div>
                      
                      {cities.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏙️</span>
                          </div>
                          <p className="text-gray-500 font-medium">No cities found</p>
                          <p className="text-sm text-gray-400 mt-1">Add your first city above to get started</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    City Details
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    Code
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    ID
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                    Type
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {cities.map((city) => (
                                  <tr key={city._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                          <span className="text-white font-bold text-xs">
                                            {city.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-semibold text-gray-900">{city.name.toUpperCase()}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        {city.code.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-600 font-mono">
                                        {city._id.slice(-6)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        <MapPin className="w-3 h-3 mr-1.5" />
                                        City
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add New Location Tab */}
                {masterDataTab === "add-location" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">📍</span>
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">Add New Location</h3>
                      </div>
                      <form onSubmit={handleAddLocation} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="locationName" className="text-sm font-semibold text-gray-700">Location Name</Label>
                            <Input
                              id="locationName"
                              placeholder="Enter location name"
                              value={newLocation.name}
                              onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                              className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationCode" className="text-sm font-semibold text-gray-700">Location Code (3 digits)</Label>
                            <Input
                              id="locationCode"
                              placeholder="e.g., BAN"
                              value={newLocation.code}
                              onChange={(e) => setNewLocation({...newLocation, code: e.target.value.toUpperCase()})}
                              maxLength={3}
                              className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="locationCity" className="text-sm font-semibold text-gray-700">
                            Select City {cities.length > 0 && `(${cities.length} available)`}
                          </Label>
                          <Select
                            value={newLocation.city_id}
                            onValueChange={(value) => {
                              const city = cities.find(c => c._id === value);
                              setNewLocation({
                                ...newLocation, 
                                city_id: value,
                                city_code: city?.code || ''
                              });
                            }}
                            required
                            disabled={cities.length === 0}
                          >
                            <SelectTrigger className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500">
                              <SelectValue placeholder={
                                cities.length === 0 ? "No cities available" : 
                                loading ? "Loading cities..." : 
                                "Choose a city"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.length > 0 ? (
                                cities.map((city) => (
                                  <SelectItem key={city._id} value={city._id}>
                                    {city.name.toUpperCase()} ({city.code.toUpperCase()})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  {loading ? "Loading cities..." : "No cities available"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {cities.length === 0 && !loading && (
                            <p className="text-sm text-orange-600 mt-2 bg-orange-50 px-3 py-2 rounded-lg">
                              💡 Add cities in Master Data first to enable location creation
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="locationAddress" className="text-sm font-semibold text-gray-700">Address</Label>
                          <Textarea
                            id="locationAddress"
                            placeholder="Enter location address"
                            value={newLocation.address}
                            onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                            className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                            rows={3}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5"
                        >
                          {loading ? "Adding..." : "Add Location"}
                        </Button>
                      </form>
                    </div>

                    {/* Locations List */}
                    <div className="border-t pt-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">📍</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Existing Locations ({locationsData.length})</h3>
                      </div>
                      
                      {locationsData.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📍</span>
                          </div>
                          <p className="text-gray-500 font-medium">No locations found</p>
                          <p className="text-sm text-gray-400 mt-1">Add your first location above to get started</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    Location Details
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    Code
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    City
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    Address
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    Type
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {locationsData.map((location) => (
                                  <tr key={location._id} className="hover:bg-green-50/30 transition-colors duration-150">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                          <span className="text-white font-bold text-xs">
                                            {location.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-semibold text-gray-900">{location.name.toUpperCase()}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        {location.code.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-900">
                                        {location.city_id?.name ? (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                            {location.city_id.name.toUpperCase()}
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">N/A</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-600 max-w-[200px] truncate" title={location.address || 'No address'}>
                                        {location.address || 'No address'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                        <MapPin className="w-3 h-3 mr-1.5" />
                                        Location
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Add New Customer Tab */}
                {masterDataTab === "add-customer" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">👤</span>
                        </div>
                        <h3 className="text-lg font-semibold text-purple-800">Add New Customer</h3>
                      </div>
                      <form onSubmit={handleAddCustomer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerName" className="text-sm font-semibold text-gray-700">Full Name</Label>
                            <Input
                              id="customerName"
                              placeholder="Enter customer name"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                              className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                            <Input
                              id="customerPhone"
                              placeholder="Enter phone number"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                              className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerAddress" className="text-sm font-semibold text-gray-700">Address</Label>
                          <Textarea
                            id="customerAddress"
                            placeholder="Enter full address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                            className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerGST" className="text-sm font-semibold text-gray-700">GST Number (Optional)</Label>
                          <Input
                            id="customerGST"
                            placeholder="Enter GST number"
                            value={newCustomer.gst_number}
                            onChange={(e) => setNewCustomer({...newCustomer, gst_number: e.target.value.toUpperCase()})}
                            className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5"
                        >
                          {loading ? "Adding..." : "Add Customer"}
                        </Button>
                      </form>
                    </div>

                    {/* Customers List */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Customers ({customers.length})</h3>
                      <div className="space-y-3">
                        {customers.map((customer) => (
                          <div key={customer._id} className="p-3 border rounded-lg bg-gray-50">
                            {editingCustomer && editingCustomer._id === customer._id ? (
                              <div className="space-y-3">
                                <Input
                                  placeholder="Customer name"
                                  value={editingCustomer.name}
                                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                                  className="text-sm"
                                />
                                <Input
                                  placeholder="Phone number"
                                  value={editingCustomer.phone}
                                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                                  className="text-sm"
                                />
                                <Textarea
                                  placeholder="Address"
                                  value={editingCustomer.address}
                                  onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                                  className="text-sm min-h-[60px]"
                                />
                                <Input
                                  placeholder="GST number (optional)"
                                  value={editingCustomer.gst_number}
                                  onChange={(e) => setEditingCustomer({...editingCustomer, gst_number: e.target.value.toUpperCase()})}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      handleEditCustomer(customer._id, editingCustomer);
                                      setEditingCustomer(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingCustomer(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-600">Phone: {customer.phone}</div>
                                {customer.gst_number && (
                                  <div className="text-sm text-gray-600">GST: {customer.gst_number}</div>
                                )}
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingCustomer(customer)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="text-xs"
                                    onClick={() => handleDeleteCustomer(customer._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>
        )}

        {activeTab === "reports" && <Reports />}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{agents.length}</div>
                <p className="text-xs text-gray-600 mt-1">Registered agents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {agents.filter(agent => agent.isActive).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{locations.length}</div>
                <p className="text-xs text-gray-600 mt-1">Available locations</p>
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </div>
      </div>
      
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
        confirmText={modal.type === 'confirm' ? 'Delete' : 'OK'}
        cancelText="Cancel"
      />
    </div>
  );
}
