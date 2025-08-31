
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
import { User, Users, BarChart3, FileText } from "lucide-react";

export default function Admin() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("add-agent");

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
  const [editingCity, setEditingCity] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
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

  // Edit city
  const handleEditCity = async (cityId, updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/cities/${cityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        // Immediately update UI by updating the city in state
        setCities(prevCities => 
          prevCities.map(city => 
            city._id === cityId ? { ...city, ...updatedData } : city
          )
        );
        showModal('Success', 'City updated successfully!', 'success');
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating city:', error);
      showModal('Error', 'Error updating city', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete city
  const handleDeleteCity = async (cityId) => {
    showConfirmModal(
      'Delete City',
      'Are you sure you want to delete this city? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/cities/${cityId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            // Immediately update UI by removing the city from state
            setCities(prevCities => prevCities.filter(city => city._id !== cityId));
            showModal('Success', 'City deleted successfully!', 'success');
          } else {
            const error = await response.json();
            showModal('Error', `Error: ${error.message}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting city:', error);
          showModal('Error', 'Error deleting city', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Edit location
  const handleEditLocation = async (locationId, updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        // Immediately update UI by updating the location in state
        setLocationsData(prevLocations => 
          prevLocations.map(location => 
            location._id === locationId ? { ...location, ...updatedData } : location
          )
        );
        // Also update the locations array for agent creation
        setLocations(prevLocations => 
          prevLocations.map(location => {
            // Extract name from format "Name (CODE)" for comparison
            const locationName = location.split(' (')[0];
            return locationName === updatedData.name ? `${updatedData.name} (${updatedData.code})` : location;
          })
        );

        showModal('Success', 'Location updated successfully!', 'success');
      } else {
        const error = await response.json();
        showModal('Error', `Error: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      showModal('Error', 'Error updating location', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete location
  const handleDeleteLocation = async (locationId) => {
    showConfirmModal(
      'Delete Location',
      'Are you sure you want to delete this location? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/locations/${locationId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            // Find the location name before deleting to update the locations array
            const locationToDelete = locationsData.find(loc => loc._id === locationId);
            // Immediately update UI by removing the location from state
            setLocationsData(prevLocations => prevLocations.filter(location => location._id !== locationId));
            // Also remove from the locations array for agent creation
            if (locationToDelete) {
              const locationString = `${locationToDelete.name} (${locationToDelete.code})`;
              setLocations(prevLocations => prevLocations.filter(location => location !== locationString));
            }
            showModal('Success', 'Location deleted successfully!', 'success');
          } else {
            const error = await response.json();
            showModal('Error', `Error: ${error.message}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          showModal('Error', 'Error deleting location', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
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
              <CardTitle className="text-xl">Manage Agents</CardTitle>
              <CardDescription>
                View, edit, and manage existing agents. Location assignments are fixed and cannot be changed by agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading agents...</p>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No agents found. Add your first agent above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agents.map((agent) => (
                        <tr key={agent._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{agent.name}</td>
                          <td className="px-4 py-3 text-gray-600">{agent.email}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {agent.location.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Agent
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={agent.isActive ? "destructive" : "default"}
                                onClick={() => handleToggleStatus(agent._id, agent.isActive)}
                                className="text-xs"
                              >
                                {agent.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAgent(agent._id)}
                                className="text-xs"
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
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "master-data" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Master Data Management</CardTitle>
                <CardDescription>
                  Manage cities, locations, and customers in one centralized location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search across all master data..."
                      value={masterDataSearch}
                      onChange={(e) => {
                        const query = e.target.value;
                        console.log('Search input changed to:', query); // Debug log
                        setMasterDataSearch(query);
                        
                        // Clear previous timeout
                        if (searchTimeout) {
                          clearTimeout(searchTimeout);
                        }
                        
                        // Set new timeout for debounced search
                        const newTimeout = setTimeout(() => {
                          console.log('Search timeout triggered for:', query); // Debug log
                          if (query.trim()) {
                            performSearch(query);
                          } else {
                            console.log('Empty search, fetching all data'); // Debug log
                            fetchMasterData(); // Show all data if search is empty
                          }
                        }, 500); // 500ms delay
                        
                        setSearchTimeout(newTimeout);
                      }}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={() => performSearch(masterDataSearch)} disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('Current data state:', { cities: cities.length, locations: locationsData.length, customers: customers.length });
                      console.log('Sample cities:', cities.slice(0, 2));
                      console.log('Sample locations:', locationsData.slice(0, 2));
                      console.log('Sample customers:', customers.slice(0, 2));
                    }} 
                    variant="outline"
                    className="text-xs"
                  >
                    Debug Data
                  </Button>
                  <Button onClick={fetchMasterData} variant="outline">
                    Refresh All
                  </Button>
                  <Button 
                    onClick={() => {
                      setMasterDataSearch("");
                      fetchMasterData();
                    }} 
                    variant="outline"
                  >
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Master Data Tabs */}
            <Card>
              <CardHeader>
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: "add-city", label: "Add New City", icon: "🏙️" },
                      { id: "add-location", label: "Add New Location", icon: "📍" },
                      { id: "add-customer", label: "Add New Customer", icon: "👤" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMasterDataTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          masterDataTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                    <form onSubmit={handleAddCity} className="space-y-4 max-w-md">
                      <div>
                        <Label htmlFor="cityName" className="text-sm font-medium text-gray-700">City Name</Label>
                        <Input
                          id="cityName"
                          placeholder="Enter city name"
                          value={newCity.name}
                          onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cityCode" className="text-sm font-medium text-gray-700">City Code (3 digits)</Label>
                        <Input
                          id="cityCode"
                          placeholder="e.g., HYD"
                          value={newCity.code}
                          onChange={(e) => setNewCity({...newCity, code: e.target.value.toUpperCase()})}
                          maxLength={3}
                          className="mt-1"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {loading ? "Adding..." : "Add City"}
                      </Button>
                    </form>

                    {/* Cities List */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Cities ({cities.length})</h3>
                      <div className="space-y-3">
                        {cities.map((city) => (
                          <div key={city._id} className="p-3 border rounded-lg bg-gray-50">
                            {editingCity && editingCity._id === city._id ? (
                              <div className="space-y-3">
                                <Input
                                  placeholder="City name"
                                  value={editingCity.name}
                                  onChange={(e) => setEditingCity({...editingCity, name: e.target.value})}
                                  className="text-sm"
                                />
                                <Input
                                  placeholder="City code (3 digits)"
                                  value={editingCity.code}
                                  onChange={(e) => setEditingCity({...editingCity, code: e.target.value.toUpperCase()})}
                                  maxLength={3}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      handleEditCity(city._id, editingCity);
                                      setEditingCity(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingCity(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-gray-900">{city.name.toUpperCase()}</div>
                                                    <div className="text-sm text-gray-600">Code: {city.code.toUpperCase()}</div>
                      <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingCity(city)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="text-xs"
                                    onClick={() => handleDeleteCity(city._id)}
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

                {/* Add New Location Tab */}
                {masterDataTab === "add-location" && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddLocation} className="space-y-4 max-w-md">
                      <div>
                        <Label htmlFor="locationName" className="text-sm font-medium text-gray-700">Location Name</Label>
                        <Input
                          id="locationName"
                          placeholder="Enter location name"
                          value={newLocation.name}
                          onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="locationCode" className="text-sm font-medium text-gray-700">Location Code (3 digits)</Label>
                        <Input
                          id="locationCode"
                          placeholder="e.g., BAN"
                          value={newLocation.code}
                          onChange={(e) => setNewLocation({...newLocation, code: e.target.value.toUpperCase()})}
                          maxLength={3}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="locationCity" className="text-sm font-medium text-gray-700">
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
                          <SelectTrigger className="mt-1">
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
                          <p className="text-sm text-orange-600 mt-1">
                            💡 Add cities in Master Data first to enable location creation
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="locationAddress" className="text-sm font-medium text-gray-700">Address</Label>
                        <Textarea
                          id="locationAddress"
                          placeholder="Enter location address"
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                        {loading ? "Adding..." : "Add Location"}
                      </Button>
                    </form>

                    {/* Locations List */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Locations ({locationsData.length})</h3>
                      <div className="space-y-3">
                        {locationsData.map((location) => (
                          <div key={location._id} className="p-3 border rounded-lg bg-gray-50">
                            {editingLocation && editingLocation._id === location._id ? (
                              <div className="space-y-3">
                                <Input
                                  placeholder="Location name"
                                  value={editingLocation.name}
                                  onChange={(e) => setEditingLocation({...editingLocation, name: e.target.value})}
                                  className="text-sm"
                                />
                                <Input
                                  placeholder="Location code (3 digits)"
                                  value={editingLocation.code}
                                  onChange={(e) => setEditingLocation({...editingLocation, code: e.target.value.toUpperCase()})}
                                  maxLength={3}
                                  className="text-sm"
                                />
                                <Select
                                  value={editingLocation.city_id}
                                  onValueChange={(value) => {
                                    const city = cities.find(c => c._id === value);
                                    setEditingLocation({
                                      ...editingLocation, 
                                      city_id: value,
                                      city_code: city?.code || ''
                                    });
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Choose a city" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cities.map((city) => (
                                      <SelectItem key={city._id} value={city._id}>
                                        {city.name.toUpperCase()} ({city.code.toUpperCase()})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  placeholder="Location address"
                                  value={editingLocation.address || ''}
                                  onChange={(e) => setEditingLocation({...editingLocation, address: e.target.value})}
                                  className="text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      handleEditLocation(location._id, editingLocation);
                                      setEditingLocation(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingLocation(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-gray-900">{location.name.toUpperCase()}</div>
                                <div className="text-sm text-gray-600">Code: {location.code.toUpperCase()}</div>
                                <div className="text-sm text-gray-600">City: {location.city_id?.name || 'N/A'}</div>
                                {location.address && (
                                  <div className="text-sm text-gray-600">Address: {location.address}</div>
                                )}
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-xs"
                                    onClick={() => setEditingLocation(location)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="text-xs"
                                    onClick={() => handleDeleteLocation(location._id)}
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

                {/* Add New Customer Tab */}
                {masterDataTab === "add-customer" && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddCustomer} className="space-y-4 max-w-md">
                      <div>
                        <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Full Name</Label>
                        <Input
                          id="customerName"
                          placeholder="Enter customer name"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <Input
                          id="customerPhone"
                          placeholder="Enter phone number"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerAddress" className="text-sm font-medium text-gray-700">Address</Label>
                        <Textarea
                          id="customerAddress"
                          placeholder="Enter full address"
                          value={newCustomer.address}
                          onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerGST" className="text-sm font-medium text-gray-700">GST Number (Optional)</Label>
                        <Input
                          id="customerGST"
                          placeholder="Enter GST number"
                          value={newCustomer.gst_number}
                          onChange={(e) => setNewCustomer({...newCustomer, gst_number: e.target.value.toUpperCase()})}
                          className="mt-1"
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                        {loading ? "Adding..." : "Add Customer"}
                      </Button>
                    </form>

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
