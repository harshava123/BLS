import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/Sidebar";
import { Package, FileText, Calendar, Truck, BarChart3, Search, MapPin, AlertTriangle, Plus, X, Copy } from "lucide-react";
import { API_BASE_URL } from "@/config";

export default function Agent() {
  const [activeTab, setActiveTab] = useState("booking");
  const [agentLocation, setAgentLocation] = useState("Hyderabad"); // Default location, will be updated from user profile
  const [user, setUser] = useState(null); // User authentication state
  const [loading, setLoading] = useState(true);

  // Delivery Dashboard State
  const [lrList, setLrList] = useState([
    { id: 1, lrNo: "LR001", status: "pending", vehicleNumber: "TN01BT3543", deliveryPerson: "" },
    { id: 2, lrNo: "LR002", status: "pending", vehicleNumber: "TN01BC5525", deliveryPerson: "" },
    { id: 3, lrNo: "LR003", status: "pending", vehicleNumber: "TN01BT3543", deliveryPerson: "" }
  ]);

  // Generate next LR number using state to ensure proper updates
  const [lrCounter, setLrCounter] = useState(1000); // Will be updated based on database
  
  const generateLRNumber = useCallback(() => {
    const nextLR = lrCounter;
    setLrCounter(prev => prev + 1);
    return `LR${nextLR}`;
  }, [lrCounter]);
  
  const handleDeliveryUpdate = (lrId, field, value) => {
    setLrList(prev => prev.map(lr => 
      lr.id === lrId ? { ...lr, [field]: value } : lr
    ));
  };

  // Abstract Daily Booking State
  const [abstractData, setAbstractData] = useState({
    fromBranch: "ALL",
    toBranch: "ALL",
    dateFrom: "",
    dateTo: "",
    includeLRDetails: false
  });

  // Invoice State

  // In Search State
  const [searchData, setSearchData] = useState({
    searchType: "lrNumber",
    searchValue: "",
    waybillNumber: ""
  });

  // New Booking Form State
  const [bookingData, setBookingData] = useState({
    lr_type: "to_pay",
    from_location: {
      location_id: "",
      name: "",
      code: ""
    },
    to_location: {
      location_id: "",
      name: "",
      code: ""
    },
    sender: {
      customer_id: "",
      name: "",
      phone: "",
      gst_number: "",
      address: ""
    },
    receiver: {
      customer_id: "",
      name: "",
      phone: "",
      gst_number: "",
      address: ""
    },
    items: [
      {
        description: "",
        quantity: 1,
    weight: "",
        freight_charge: 0
      }
    ],
    charges: {
      item_freight_subtotal: 0,
      handling_charges: 0,
      book_delivery_charges: 0,
      door_delivery_charges: 0,
      pickup_charges: 0,
      lr_charges: 0,
      other_charges: 0,
      total_amount: 0
    }
  });

  // Master data for dropdowns
  const [cities, setCities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState(null);
  const [customerSearchQueryReceiver, setCustomerSearchQueryReceiver] = useState(null);

  // Use ref to track if initial LR has been set
  const initialLRSet = useRef(false);
  


  // Fetch the highest LR number from database and set counter
  const fetchHighestLRNumber = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`);
      if (response.ok) {
        const bookings = await response.json();
        if (bookings.length > 0) {
          // Extract numbers from LR numbers (LR1000 -> 1000)
          const lrNumbers = bookings
            .map(booking => booking.lrNumber)
            .filter(lr => lr && lr.startsWith('LR'))
            .map(lr => parseInt(lr.replace('LR', '')))
            .filter(num => !isNaN(num));
          
          if (lrNumbers.length > 0) {
            const highestLR = Math.max(...lrNumbers);
            setLrCounter(highestLR + 1); // Start from next number
          } else {
            setLrCounter(1000); // Default if no valid LR numbers found
          }
        } else {
          setLrCounter(1000); // Default if no bookings exist
        }
      } else {
        setLrCounter(1000); // Fallback to default
      }
    } catch {
      setLrCounter(1000); // Fallback to default
    }
  };
  
  // Set initial LR number when component mounts (only once)
  useEffect(() => {
    if (!initialLRSet.current) {
      // First fetch the highest LR number, then set the initial LR
      fetchHighestLRNumber().then(() => {
        // This will trigger another useEffect when lrCounter changes
      });
    }
  }, []);
  
  // Set initial LR number when lrCounter is updated
  useEffect(() => {
    if (lrCounter > 1000 && !initialLRSet.current) {
      const initialLR = `LR${lrCounter}`;
      setBookingData(prev => ({
        ...prev,
        lrNumber: initialLR
      }));
      initialLRSet.current = true;
    }
  }, [lrCounter]);



  // Calculate total of additional charges only (memoized to prevent infinite re-renders)
  const currentTotal = useMemo(() => {
    const lrCharge = parseFloat(bookingData.lrCharge) || 0;
    const handling = parseFloat(bookingData.handling) || 0;
    const pickup = parseFloat(bookingData.pickup) || 0;
    const doorDelivery = parseFloat(bookingData.doorDelivery) || 0;
    const others = parseFloat(bookingData.others) || 0;
    
    // Calculate total of additional charges only
    const total = lrCharge + handling + pickup + doorDelivery + others;
    
    return total.toFixed(2);
  }, [bookingData.lrCharge, bookingData.handling, bookingData.pickup, bookingData.doorDelivery, bookingData.others]);
  


  // Helper functions for new booking form
  const handleBookingChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSenderChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      sender: { ...prev.sender, [field]: value }
    }));
  };

  const handleReceiverChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      receiver: { ...prev.receiver, [field]: value }
    }));
  };

  const handleItemChange = (index, field, value) => {
    setBookingData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleChargesChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      charges: { ...prev.charges, [field]: parseFloat(value) || 0 }
    }));
  };

  const addItem = () => {
    setBookingData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, weight: "", freight_charge: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (bookingData.items.length > 1) {
      setBookingData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const copySenderToReceiver = () => {
    setBookingData(prev => ({
      ...prev,
      receiver: { ...prev.sender }
    }));
  };

  // Calculate totals
  const itemFreightSubtotal = useMemo(() => {
    return bookingData.items.reduce((sum, item) => sum + (parseFloat(item.freight_charge) || 0), 0);
  }, [bookingData.items]);

  const totalAmount = useMemo(() => {
    const { charges } = bookingData;
    return itemFreightSubtotal + 
           (charges.handling_charges || 0) + 
           (charges.book_delivery_charges || 0) + 
           (charges.door_delivery_charges || 0) + 
           (charges.pickup_charges || 0) + 
           (charges.lr_charges || 0) + 
           (charges.other_charges || 0);
  }, [itemFreightSubtotal, bookingData.charges]);

  // Update freight subtotal when items change
  useEffect(() => {
    handleChargesChange('item_freight_subtotal', itemFreightSubtotal);
  }, [itemFreightSubtotal]);

  // Update total amount when charges change
  useEffect(() => {
    handleChargesChange('total_amount', totalAmount);
  }, [totalAmount]);

  // Keyboard navigation support (Tab for next, Esc for previous)
  const handleKeyDown = (e, currentIndex, totalFields) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % totalFields;
      const nextField = document.querySelector(`[data-field-index="${nextIndex}"]`);
      if (nextField) nextField.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? totalFields - 1 : currentIndex - 1;
      const prevField = document.querySelector(`[data-field-index="${prevIndex}"]`);
      if (prevField) prevField.focus();
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Get current user info
    const authUser = localStorage.getItem("auth_user");
    const user = authUser ? JSON.parse(authUser) : null;
    
    // Validate required fields
    if (!bookingData.to_location.location_id || !bookingData.sender.name || !bookingData.receiver.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (bookingData.items.length === 0 || !bookingData.items[0].description) {
      alert('Please add at least one item');
      return;
    }

          // Create customers if they don't exist
      let senderCustomerId = bookingData.sender.customer_id;
      let receiverCustomerId = bookingData.receiver.customer_id;

      // Create sender customer if new
      if (!senderCustomerId) {
        try {
          const senderResponse = await fetch(`${API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: bookingData.sender.name,
              phone: bookingData.sender.phone,
              address: bookingData.sender.address,
              gst_number: bookingData.sender.gst_number
            })
          });
          
          if (senderResponse.ok) {
            const senderCustomer = await senderResponse.json();
            senderCustomerId = senderCustomer._id;
          }
        } catch (error) {
          console.error('Error creating sender customer:', error);
        }
      }

      // Create receiver customer if new
      if (!receiverCustomerId) {
        try {
          const receiverResponse = await fetch(`${API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: bookingData.receiver.name,
              phone: bookingData.receiver.phone,
              address: bookingData.receiver.address,
              gst_number: bookingData.receiver.gst_number
            })
          });
          
          if (receiverResponse.ok) {
            const receiverCustomer = await receiverResponse.json();
            receiverCustomerId = receiverCustomer._id;
          }
        } catch (error) {
          console.error('Error creating receiver customer:', error);
        }
      }
    
      // Validate agent authentication
      console.log('🔐 Checking user authentication:', { user, userId: user?.id });
      if (!user?.id) {
        console.error('❌ User not authenticated:', user);
        alert('Please login to create a booking');
        return;
      }
      console.log('✅ User authenticated successfully:', user.name);

      // Prepare booking data with agent info
      const bookingDataWithAgent = {
        ...bookingData,
        sender: { ...bookingData.sender, customer_id: senderCustomerId },
        receiver: { ...bookingData.receiver, customer_id: receiverCustomerId },
        agent_id: user.id,
        agent_location: agentLocation,
        status: "booked"
      };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingDataWithAgent),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Booking saved:', result);
        alert('Booking confirmed and saved!');
          
          // Reset form
          setBookingData({
            lr_type: "to_pay",
            from_location: {
              location_id: "",
              name: "",
              code: ""
            },
            to_location: {
              location_id: "",
              name: "",
              code: ""
            },
            sender: {
              customer_id: "",
              name: "",
              phone: "",
              gst_number: "",
              address: ""
            },
            receiver: {
              customer_id: "",
              name: "",
              phone: "",
              gst_number: "",
              address: ""
            },
            items: [
              {
                description: "",
                quantity: 1,
          weight: "",
                freight_charge: 0
              }
            ],
            charges: {
              item_freight_subtotal: 0,
              handling_charges: 0,
              book_delivery_charges: 0,
              door_delivery_charges: 0,
              pickup_charges: 0,
              lr_charges: 0,
              other_charges: 0,
              total_amount: 0
            }
          });
      } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving booking. Please check if the backend server is running.');
    }
  };

  // Fetch master data for dropdowns
  const fetchMasterData = async () => {
    try {
      console.log('Fetching master data from:', `${API_BASE_URL}/api/master-data`); // Debug log
      const response = await fetch(`${API_BASE_URL}/api/master-data`);
      console.log('Response status:', response.status); // Debug log
      console.log('Response ok:', response.ok); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('Master data received:', data); // Debug log
        console.log('Cities count:', data.cities?.length); // Debug log
        console.log('Sample cities:', data.cities?.slice(0, 3)); // Debug log
        console.log('Full cities array:', data.cities); // Debug log
        
        if (data.cities && Array.isArray(data.cities)) {
          setCities(data.cities);
          console.log('Cities state set successfully');
        } else {
          console.error('Cities data is not an array:', data.cities);
          setCities([]);
        }
        
        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        } else {
          setCustomers([]);
        }
      } else {
        console.error('Failed to fetch master data:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  // Set user state from localStorage
  useEffect(() => {
    const authUser = localStorage.getItem("auth_user");
    const authToken = localStorage.getItem("auth_token");
    console.log('🔍 Checking localStorage:', { authUser: !!authUser, authToken: !!authToken });
    
    if (authUser) {
      const userData = JSON.parse(authUser);
      setUser(userData);
      console.log('✅ User loaded from localStorage:', userData);
    } else {
      console.log('❌ No auth_user found in localStorage');
    }
    
    if (!authToken) {
      console.log('❌ No auth_token found in localStorage');
    }
  }, []);

  // Fetch agent location and master data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found');
          setAgentLocation("Hyderabad");
          setBookingData(prev => ({
            ...prev,
            from_location: {
              location_id: "default_hyderabad",
              name: "Hyderabad",
              code: "HYD"
            }
          }));
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('User profile data:', data); // Debug log
          if (data.user && data.user.location) {
            setAgentLocation(data.user.location);
            console.log('Agent location set to:', data.user.location); // Debug log
            
            // Find the location details from the locations collection
            const locationResponse = await fetch(`${API_BASE_URL}/api/locations?search=${encodeURIComponent(data.user.location)}`);
            if (locationResponse.ok) {
              const locations = await locationResponse.json();
              const agentLocationData = locations.find(loc => loc.name === data.user.location);
              
              if (agentLocationData) {
                // Set from_location with proper location data
                setBookingData(prev => ({
                  ...prev,
                  from_location: {
                    location_id: agentLocationData._id,
                    name: agentLocationData.name,
                    code: agentLocationData.code
                  }
                }));
                console.log('From location set to:', agentLocationData);
              } else {
                // Location not found - we need to create it or use a fallback
                console.log('⚠️ Location not found in locations collection:', data.user.location);
                console.log('🔍 Available locations:', locations.map(loc => ({ name: loc.name, code: loc.code })));
                
                // Try to find a fallback location (like Hyderabad) or create the missing location
                const fallbackLocation = locations.find(loc => loc.name === "Hyderabad");
                if (fallbackLocation) {
                  console.log('🔄 Using Hyderabad as fallback location');
                  setBookingData(prev => ({
                    ...prev,
                    from_location: {
                      location_id: fallbackLocation._id,
                      name: fallbackLocation.name,
                      code: fallbackLocation.code
                    }
                  }));
                  setAgentLocation("Hyderabad"); // Update UI to show fallback
                } else {
                  console.error('❌ No fallback location found, cannot proceed');
                  alert(`Location "${data.user.location}" not found in system. Please contact admin to add this location.`);
                  return;
                }
              }
            } else {
              // API call failed - try to use a fallback
              console.log('⚠️ Location API call failed, trying fallback');
              try {
                const fallbackResponse = await fetch(`${API_BASE_URL}/api/locations?search=Hyderabad`);
                if (fallbackResponse.ok) {
                  const fallbackLocations = await fallbackResponse.json();
                  const hyderabadLocation = fallbackLocations.find(loc => loc.name === "Hyderabad");
                  if (hyderabadLocation) {
                    setBookingData(prev => ({
                      ...prev,
                      from_location: {
                        location_id: hyderabadLocation._id,
                        name: hyderabadLocation.name,
                        code: hyderabadLocation.code
                      }
                    }));
                    setAgentLocation("Hyderabad");
                    console.log('🔄 Using Hyderabad as fallback due to API failure');
                  }
                }
              } catch (fallbackError) {
                console.error('❌ Fallback location fetch also failed:', fallbackError);
                alert('Unable to load location data. Please contact admin.');
                return;
              }
            }
          } else {
            console.log('No location found in user data:', data.user); // Debug log
            // Set a default location if none is found
            setAgentLocation("Hyderabad");
            setBookingData(prev => ({
              ...prev,
              from_location: {
                location_id: "default_hyderabad",
                name: "Hyderabad",
                code: "HYD"
              }
            }));
          }
        } else {
          console.error('Failed to fetch user profile');
          // Set a default location as fallback
          setAgentLocation("Hyderabad");
          setBookingData(prev => ({
            ...prev,
            from_location: {
              location_id: "default_hyderabad",
              name: "Hyderabad",
              code: "HYD"
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching agent location:', error);
        // Set a default location as fallback
        setAgentLocation("Hyderabad");
        setBookingData(prev => ({
          ...prev,
          from_location: {
            location_id: "default_hyderabad",
            name: "Hyderabad",
            code: "HYD"
          }
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchMasterData();
  }, []);

  // Debug: Log cities state changes
  useEffect(() => {
    console.log('Cities state updated:', cities);
  }, [cities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const toLocationField = document.getElementById('to-location-field');
      const customerField = document.getElementById('customer-field');
      const receiverCustomerField = document.getElementById('receiver-customer-field');
      
      // Only close location dropdown if clicking outside location field
      if (toLocationField && !toLocationField.contains(event.target)) {
        setSearchQuery(null);
      }
      
      // Only close customer dropdown if clicking outside customer field
      if (customerField && !customerField.contains(event.target)) {
        setCustomerSearchQuery(null);
      }
      
      // Only close receiver customer dropdown if clicking outside receiver customer field
      if (receiverCustomerField && !receiverCustomerField.contains(event.target)) {
        setCustomerSearchQueryReceiver(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Loading Sheet State
  const [loadingData, setLoadingData] = useState({
    bookingBranch: "",
    deliveryBranch: "",
    vehicleNumber: "",
    driverName: "",
    driverMobile: "",
    selectedLRs: [],
    lrRows: [
      { lrNo: "", bDate: "", payment: "TOPAY", sender: "", receiver: "", articles: "", freight: "" },
    ],
    totalFreight: "",
    doorDelivery: "",
    pickup: "",
    handling: "",
  });

  const handleLoadingChange = (e) => {
    setLoadingData({ ...loadingData, [e.target.name]: e.target.value });
  };

  const handleLRRowChange = (index, e) => {
    const rows = [...loadingData.lrRows];
    rows[index][e.target.name] = e.target.value;
    setLoadingData({ ...loadingData, lrRows: rows });
  };

  const addLRRow = () => {
    setLoadingData({
      ...loadingData,
      lrRows: [
        ...loadingData.lrRows,
        { lrNo: "", bDate: "", payment: "TOPAY", sender: "", receiver: "", articles: "", freight: "" },
      ],
    });
  };

  const handleLoadingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/loading-sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loadingData),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loading Sheet saved:', result);
        alert('Loading Sheet confirmed and saved!');
        // Reset form
        setLoadingData({
          bookingBranch: "",
          deliveryBranch: "",
          vehicleNumber: "",
          driverName: "",
          driverMobile: "",
          selectedLRs: [],
          lrRows: [
            { lrNo: "", bDate: "", payment: "TOPAY", sender: "", receiver: "", articles: "", freight: "" },
          ],
          totalFreight: "",
          doorDelivery: "",
          pickup: "",
          handling: "",
        });
      } else {
        alert('Error saving loading sheet');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving loading sheet. Please check if the backend server is running.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Unified Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="agent" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <p className="text-xs text-gray-500">Home {'>>'} {activeTab} {'>>'} List</p>
        </div>

        

        {/* Section Header - Removed blue bar, keeping only breadcrumbs */}
        <div className="mb-6">
          {/* Breadcrumbs only */}
              </div>

                        {/* New Booking Form */}
        {activeTab === "booking" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <form onSubmit={handleBookingSubmit}>
              {/* Section 1: Booking Metadata - Green Header Bar */}
              <div className="bg-green-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-center">
                  <h3 className="text-xl font-semibold">Cargo Booking</h3>
              </div>
              </div>

              {/* Section 1: Booking Metadata - Form Fields */}
              <div className="p-6 border-b border-gray-200">


                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">LR Type *</Label>
                    <Select
                      value={bookingData.lr_type}
                      onValueChange={(value) => handleBookingChange('lr_type', value)}
                    >
                      <SelectTrigger className="h-10" data-field-index="0">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="to_pay">To Pay</SelectItem>
                        <SelectItem value="on_account">On Account</SelectItem>
                      </SelectContent>
                    </Select>
        </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">From Location *</Label>
                    <Input
                      value={agentLocation || "Loading location..."}
                      className="h-10 bg-gray-100"
                      readOnly
                    />
              </div>

                                                          <div id="to-location-field" className="relative">
                      <Label className="text-sm font-medium text-gray-700">To Location *</Label>
                      <div className="relative">
                        <Input
                          placeholder="Search location..."
                          value={searchQuery || bookingData.to_location.name || ""}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setSearchQuery("")} // Show all cities when focused
                          onBlur={() => {
                            // Hide dropdown after a short delay
                            setTimeout(() => setSearchQuery(null), 200);
                          }}
                          className="h-10 pr-10"
                        />
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />

                      </div>
                      {searchQuery !== null && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {cities.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No cities available</div>
                          ) : cities
                            .filter(city => 
                              city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              city.code.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(city => (
                              <div
                                key={city._id}
                                className="px-3 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation"
                                onMouseDown={() => {
                                  console.log('City selected:', city); // Debug log
                                  setBookingData(prev => ({
                                    ...prev,
                                    to_location: {
                                      location_id: city._id,
                                      name: city.name,
                                      code: city.code
                                    }
                                  }));
                                  setSearchQuery(null); // Hide dropdown after selection
                                  console.log('Updated booking data:', {
                                    ...bookingData,
                                    to_location: {
                                      location_id: city._id,
                                      name: city.name,
                                      code: city.code
                                    }
                                  }); // Debug log
                                }}
                                onTouchStart={() => {
                                  console.log('City touched:', city); // Debug log
                                  setBookingData(prev => ({
                                    ...prev,
                                    to_location: {
                                      location_id: city._id,
                                      name: city.name,
                                      code: city.code
                                    }
                                  }));
                                  setSearchQuery(null); // Hide dropdown after selection
                                }}
                              >
                                {city.name} ({city.code})
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date</Label>
                    <Input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      className="h-10"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parties Involved - Two Side-by-Side Cards */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sender Details Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Sender Details</h4>
                    <div className="space-y-4">
                  <div id="customer-field" className="relative">
                        <Label className="text-sm font-medium text-gray-700">Customer Name *</Label>
                        <div className="relative">
                    <Input
                            placeholder="Search or enter customer name..."
                            value={customerSearchQuery || bookingData.sender.name || ""}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            onFocus={() => setCustomerSearchQuery("")}
                            onBlur={() => {
                              setTimeout(() => setCustomerSearchQuery(null), 200);
                            }}
                            className="h-10 pr-10"
                          />
                          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                        {customerSearchQuery !== null && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto" style={{ maxWidth: 'calc(100% - 2rem)' }}>
                            {customers
                              .filter(cust => 
                                cust.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                                cust.phone.includes(customerSearchQuery)
                              )
                              .map(customer => (
                                <div
                                  key={customer._id}
                                  className="px-3 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation"
                                  onMouseDown={() => {
                                    setBookingData(prev => ({
                                      ...prev,
                                      sender: {
                                        customer_id: customer._id,
                                        name: customer.name,
                                        phone: customer.phone,
                                        gst_number: customer.gst_number || "",
                                        address: customer.address
                                      }
                                    }));
                                    setCustomerSearchQuery(null);
                                  }}
                                  onTouchStart={() => {
                                    setBookingData(prev => ({
                                      ...prev,
                                      sender: {
                                        customer_id: customer._id,
                                        name: customer.name,
                                        phone: customer.phone,
                                        gst_number: customer.gst_number || "",
                                        address: customer.address
                                      }
                                    }));
                                    setCustomerSearchQuery(null);
                                  }}
                                >
                                  {customer.name} - {customer.phone}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      
                  <div>
                        <Label className="text-sm font-medium text-gray-700">Mobile No</Label>
                    <Input
                          placeholder="10 digit mobile number"
                          value={bookingData.sender.phone}
                          onChange={(e) => handleSenderChange('phone', e.target.value)}
                          className="h-10"
                      required
                    />
                  </div>
                      
                  <div>
                        <Label className="text-sm font-medium text-gray-700">GST Number</Label>
                    <Input
                          placeholder="GST Number"
                          value={bookingData.sender.gst_number}
                          onChange={(e) => handleSenderChange('gst_number', e.target.value)}
                          className="h-10"
                  />
                </div>
                      
                <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <Textarea
                          placeholder="Full address"
                          value={bookingData.sender.address}
                          onChange={(e) => handleSenderChange('address', e.target.value)}
                          className="min-h-[80px]"
                          required
                  />
                  </div>
                </div>
              </div>

                  {/* Receiver Details Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Receiver Details</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copySenderToReceiver}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Sender details
                      </Button>
                    </div>
                    <div className="space-y-4">
                  <div id="receiver-customer-field" className="relative">
                        <Label className="text-sm font-medium text-gray-700">Customer Name *</Label>
                        <div className="relative">
                          <Input
                            placeholder="Search or enter customer name..."
                            value={customerSearchQueryReceiver || bookingData.receiver.name || ""}
                            onChange={(e) => setCustomerSearchQueryReceiver(e.target.value)}
                            onFocus={() => setCustomerSearchQueryReceiver("")}
                            onBlur={() => {
                              setTimeout(() => setCustomerSearchQueryReceiver(null), 200);
                            }}
                            className="h-10 pr-10"
                            required
                          />
                          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        {customerSearchQueryReceiver !== null && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto" style={{ maxWidth: 'calc(100% - 2rem)' }}>
                            {customers
                              .filter(cust => 
                                cust.name.toLowerCase().includes(customerSearchQueryReceiver.toLowerCase()) ||
                                cust.phone.includes(customerSearchQueryReceiver)
                              )
                              .map(customer => (
                                <div
                                  key={customer._id}
                                  className="px-3 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation"
                                  onMouseDown={() => {
                                    setBookingData(prev => ({
                                      ...prev,
                                      receiver: {
                                        customer_id: customer._id,
                                        name: customer.name,
                                        phone: customer.phone,
                                        gst_number: customer.gst_number || "",
                                        address: customer.address
                                      }
                                    }));
                                    setCustomerSearchQueryReceiver(null);
                                  }}
                                  onTouchStart={() => {
                                    setBookingData(prev => ({
                                      ...prev,
                                      receiver: {
                                        customer_id: customer._id,
                                        name: customer.name,
                                        phone: customer.phone,
                                        gst_number: customer.gst_number || "",
                                        address: customer.address
                                      }
                                    }));
                                    setCustomerSearchQueryReceiver(null);
                                  }}
                                >
                                  {customer.name} - {customer.phone}
                                </div>
                              ))}
                          </div>
                        )}
                  </div>
                      
                  <div>
                        <Label className="text-sm font-medium text-gray-700">Mobile No</Label>
                    <Input
                          placeholder="10 digit mobile number"
                          value={bookingData.receiver.phone}
                          onChange={(e) => handleReceiverChange('phone', e.target.value)}
                          className="h-10"
                      required
                />
                  </div>
                      
                  <div>
                        <Label className="text-sm font-medium text-gray-700">GST Number</Label>
                    <Input
                          placeholder="GST Number"
                          value={bookingData.receiver.gst_number}
                          onChange={(e) => handleReceiverChange('gst_number', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <Textarea
                          placeholder="Full address"
                          value={bookingData.receiver.address}
                          onChange={(e) => handleReceiverChange('address', e.target.value)}
                          className="min-h-[80px]"
                      required
                />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Item List */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Item List</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Item Description</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Quantity</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Weight (kg)</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Freight Charge (₹)</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Total (₹)</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2">
                            <Input
                              placeholder="Enter item description"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="h-8 text-sm"
                              required
                            />
                          </td>
                          <td className="py-2 px-2">
                    <Input
                  type="number"
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-8 text-sm w-20"
                              min="1"
                      required
                />
                          </td>
                          <td className="py-2 px-2">
                    <Input
                              type="number"
                              placeholder="0"
                              value={item.weight}
                              onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                              className="h-8 text-sm w-20"
                              step="0.01"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.freight_charge}
                              onChange={(e) => handleItemChange(index, 'freight_charge', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm w-24"
                              step="0.01"
                      required
                    />
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{((item.quantity || 1) * (item.freight_charge || 0)).toFixed(2)}
                  </div>
                          </td>
                          <td className="py-2 px-2">
                            {bookingData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  + Add Item
                </Button>
              </div>

              {/* Section 4: Charges Summary */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Charges Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Item Freight Subtotal (₹)</Label>
                    <Input
                      value={itemFreightSubtotal.toFixed(2)}
                      className="h-10 bg-gray-100 font-medium"
                      readOnly
                />
              </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Handling Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.handling_charges}
                      onChange={(e) => handleChargesChange('handling_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
              </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Book Delivery Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.book_delivery_charges}
                      onChange={(e) => handleChargesChange('book_delivery_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Door Delivery Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.door_delivery_charges}
                      onChange={(e) => handleChargesChange('door_delivery_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Pickup Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.pickup_charges}
                      onChange={(e) => handleChargesChange('pickup_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">LR Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.lr_charges}
                      onChange={(e) => handleChargesChange('lr_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Other Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.other_charges}
                      onChange={(e) => handleChargesChange('other_charges', e.target.value)}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Total Amount (₹)</Label>
                    <Input
                      value={totalAmount.toFixed(2)}
                      className="h-10 bg-red-100 font-bold text-red-900 text-lg"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-6 flex justify-end">
                <Button 
                type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                  Confirm Cargo Booking
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading Sheet Tab */}
        {activeTab === "loading" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Loading Sheet</h3>
              {agentLocation && (
                <div className="text-sm text-gray-600">
                  📍 Location: <span className="font-medium text-blue-600">{agentLocation}</span>
                </div>
              )}
            </div>
            
            <form onSubmit={handleLoadingSubmit} className="space-y-6">
                {/* Branch & Vehicle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                    <Label className="text-xs font-medium text-gray-600">Booking Branch</Label>
                    <Input
                  type="text"
                  name="bookingBranch"
                  placeholder="Select Booking Branch"
                  value={loadingData.bookingBranch}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Delivery Branch</Label>
                    <Input
                  type="text"
                  name="deliveryBranch"
                  placeholder="Select Delivery Branch"
                  value={loadingData.deliveryBranch}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Vehicle Number</Label>
                    <Input
                  type="text"
                  name="vehicleNumber"
                  placeholder="Vehicle Number"
                  value={loadingData.vehicleNumber}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Driver Name</Label>
                    <Input
                  type="text"
                  name="driverName"
                  placeholder="Driver Name"
                  value={loadingData.driverName}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-gray-600">Driver Mobile</Label>
                    <Input
                  type="text"
                  name="driverMobile"
                  placeholder="Driver Mobile"
                  value={loadingData.driverMobile}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
              </div>

              {/* LR Rows */}
              <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Loaded LRs</h4>
                {loadingData.lrRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 mb-2 border-b pb-2">
                      <Input
                      type="text"
                      name="lrNo"
                      placeholder="LR No"
                      value={row.lrNo}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                      <Input
                      type="date"
                      name="bDate"
                      value={row.bDate}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                    <select
                      name="payment"
                      value={row.payment}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs border border-gray-300 rounded px-2"
                    >
                      <option value="TOPAY">TOPAY</option>
                      <option value="PAID">PAID</option>
                      <option value="ON ACC">ON ACC</option>
                    </select>
                      <Input
                      type="text"
                      name="sender"
                      placeholder="Sender"
                      value={row.sender}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                      <Input
                      type="text"
                      name="receiver"
                      placeholder="Receiver"
                      value={row.receiver}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                      <Input
                      type="number"
                      name="articles"
                      placeholder="Articles"
                      value={row.articles}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                      <Input
                      type="number"
                      name="freight"
                      placeholder="Freight"
                      value={row.freight}
                      onChange={(e) => handleLRRowChange(index, e)}
                        className="h-8 text-xs"
                    />
                  </div>
                ))}
                  <Button
                  type="button"
                  onClick={addLRRow}
                    variant="outline"
                    className="h-8 px-3 text-xs"
                >
                  + Add LR
                  </Button>
              </div>

              {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Total Freight</Label>
                    <Input
                  type="number"
                  name="totalFreight"
                  placeholder="Total Freight"
                  value={loadingData.totalFreight}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Door Delivery</Label>
                    <Input
                  type="number"
                  name="doorDelivery"
                  placeholder="Door Delivery"
                  value={loadingData.doorDelivery}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Pickup</Label>
                    <Input
                  type="number"
                  name="pickup"
                  placeholder="Pickup"
                  value={loadingData.pickup}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Handling Charges</Label>
                    <Input
                  type="number"
                  name="handling"
                  placeholder="Handling Charges"
                  value={loadingData.handling}
                  onChange={handleLoadingChange}
                      className="h-8 text-sm mt-1"
                />
                  </div>
              </div>

              {/* Submit */}
                <div className="flex justify-end">
                  <Button
                type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm"
              >
                Confirm Load Sheet
                  </Button>
                </div>
            </form>
          </div>
        )}

        {/* Delivery Dashboard Tab */}
        {activeTab === "delivery" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-200 px-4 py-2 rounded mr-4">
                <span className="text-green-800 font-bold text-sm">DELIVERY</span>
              </div>
              <h3 className="text-lg font-medium text-gray-800">DASH BOARD</h3>
            </div>
            
            <div className="text-center mb-6">
              <h4 className="text-sm font-medium text-gray-700">ALL LRS RECEIVED FROM KTD - {agentLocation.toUpperCase()}</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">LR NO</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">UPDATE DELIVERY</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">VEHICLE NUMBER</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">DELIVERY TAKEN PERSON DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {lrList.map((lr) => (
                    <tr key={lr.id} className="border-b border-gray-200">
                      <td className="px-4 py-2">{lr.lrNo}</td>
                      <td className="px-4 py-2">
                        <select
                          value={lr.status}
                          onChange={(e) => handleDeliveryUpdate(lr.id, 'status', e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="delivered">Delivered</option>
                          <option value="inTransit">In Transit</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">{lr.vehicleNumber}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="text"
                          placeholder="Enter person details"
                          value={lr.deliveryPerson}
                          onChange={(e) => handleDeliveryUpdate(lr.id, 'deliveryPerson', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-200 px-4 py-2 rounded mr-4">
                <span className="text-green-800 font-bold text-sm">REPORTS</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Reports</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>DAILY BOOKING REG</div>
                  <div>DAILY DELIVERY REG</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">DOWNLOAD</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>PDF</div>
                  <div>EXCEL</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Abstract Daily Booking Tab */}
        {activeTab === "abstractDailyBooking" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-200 px-4 py-2 rounded mr-4">
                <span className="text-green-800 font-bold text-sm">ABSTRACT DAILY BOOKING</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">FROM :- ALL</Label>
                  <Input
                    type="text"
                    placeholder="SELECT BRANCH"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">TO ALL</Label>
                  <Input
                    type="text"
                    placeholder="SELECT BRANCH"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">DATE FROM TO</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      type="date"
                      className="h-8 text-xs"
                    />
                    <Input
                      type="date"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={abstractData.includeLRDetails}
                      onChange={(e) => setAbstractData({...abstractData, includeLRDetails: e.target.checked})}
                    />
                    <span className="text-xs text-gray-600">ALONG WITH LR DETAILS</span>
                  </label>
                </div>
              </div>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm">
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {/* Invoice Tab */}
        {activeTab === "invoice" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-200 px-4 py-2 rounded mr-4">
                <span className="text-green-800 font-bold text-sm">INVOICE</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">ON ACCOUNT INVOICE</div>
              <div className="text-sm font-medium text-gray-700">PAID BOOKING INVOICE</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Customer Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter customer name"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600">Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    className="h-8 text-sm mt-1"
                  />
                </div>
                
          <div>
                  <Label className="text-xs font-medium text-gray-600">Date</Label>
                  <Input
                    type="date"
                    className="h-8 text-sm mt-1"
                  />
                </div>
              </div>
              
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm">
                Generate Invoice
              </Button>
            </div>
          </div>
        )}

        {/* In Search Tab */}
        {activeTab === "inSearch" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-200 px-4 py-2 rounded mr-4">
                <span className="text-green-800 font-bold text-sm">IN SEARCH</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div>BY LR NUMBER</div>
                  <div>BY L SHEET NUMBER</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">Search Type</Label>
                    <select
                      value={searchData.searchType}
                      onChange={(e) => setSearchData({...searchData, searchType: e.target.value})}
                      className="w-full h-8 text-xs border border-gray-300 rounded px-2 mt-1"
                    >
                      <option value="lrNumber">LR Number</option>
                      <option value="lSheetNumber">L Sheet Number</option>
                    </select>
                  </div>
                  
          <div>
                    <Label className="text-xs font-medium text-gray-600">Search Value</Label>
                    <Input
                      type="text"
                      placeholder="Enter search value"
                      value={searchData.searchValue}
                      onChange={(e) => setSearchData({...searchData, searchValue: e.target.value})}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>
                
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm">
                  Search
                </Button>
              </div>
              
              {/* Waybill Tracking Section */}
              <div className="border-t pt-6">
                <div className="text-center mb-4">
                  <div className="bg-black text-white px-6 py-2 rounded inline-block text-sm">
                    Track Way bill Number : KTD-001
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Booking</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Station: HYK(HYDERABAD KATTENDAN)</div>
                      <div>Name: MANJUSHREE POLYMERS PVT LTD</div>
                      <div>Mobile : 9391522251</div>
                      <div>Booking Amount: 35000</div>
                      <div>Commodity Type: POLY BAG</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Station: MDUH(MADURAI)</div>
                      <div>Name: PATWARI BAKERS PVT LTD</div>
                      <div>Mobile: 9391522251</div>
                      <div>Delivery Type: Door Delivery</div>
                      <div>Quantity : 193</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Position</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Booked at HYK(HYDERABAD</div>
                      <div>Loaded to(CHENNAI)(TN01BT3543)</div>
                      <div>unloaded at(CHENNAI) (TN01BT3543)</div>
                      <div>Delivered On: <span className="text-green-600 font-medium">DELIVERED</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>29-Mar-25</div>
                      <div>3/29/2025 20:41</div>
                      <div>3/30/2025 05:40:37 AM</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">DESCRIPTION of Payments</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>CASH 30000 GIVEN TO VEHICLE RENT</div>
                    <div>TN01BC5525 BALANCE 5000/- GIVEN TO</div>
                    <div>AYYPPA ANNA THROUGH P PAY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === "upcoming" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Upcoming</h3>
            <p className="text-sm text-gray-600">Upcoming consignments will be shown here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
