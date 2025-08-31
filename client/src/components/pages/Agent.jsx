import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/Sidebar";
import LocationBookings from "./LocationBookings";
import { Package, FileText, Calendar, Truck, BarChart3, Search, MapPin, AlertTriangle, Plus, X, Copy, User } from "lucide-react";
import { API_BASE_URL } from "@/config";

export default function Agent() {
  const [activeTab, setActiveTab] = useState("booking");
  const [agentLocation, setAgentLocation] = useState("Hyderabad (HYD)"); // Default location, will be updated from user profile
  const [user, setUser] = useState(null); // User authentication state
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lrNumber, setLrNumber] = useState("");
  const [currentBooking, setCurrentBooking] = useState(null);

  // Delivery Dashboard State
  const [lrList, setLrList] = useState([
    { id: 1, lrNo: "LR001", status: "pending", vehicleNumber: "TN01BT3543", deliveryPerson: "" },
    { id: 2, lrNo: "LR002", status: "pending", vehicleNumber: "TN01BC5525", deliveryPerson: "" },
    { id: 3, lrNo: "LR003", status: "pending", vehicleNumber: "TN01BT3543", deliveryPerson: "" }
  ]);

  // Generate next LR number using state to ensure proper updates
  const [lrCounter, setLrCounter] = useState(1000); // Will be updated based on database
  
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
      location_id: "default_hyderabad",
      name: "HYDERABAD",
      code: "HYD",
      address: "Hyderabad, Telangana, India"
    },
    to_location: {
      location_id: "",
      name: "",
      code: "",
      address: ""
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
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState(null);
  const [customerSearchQueryReceiver, setCustomerSearchQueryReceiver] = useState(null);

  // Generate next LR number using state to ensure proper updates
  const generateLRNumber = useCallback(() => {
    const nextLR = lrCounter;
    setLrCounter(prev => prev + 1);
    // Generate LR number in format: LR-HYD-TP-XXXX (Location-Type-Random)
    const locationCode = bookingData.from_location.code || "HYD";
    const typeCode = bookingData.lr_type === "to_pay" ? "TP" : 
                    bookingData.lr_type === "paid" ? "PD" : "AC";
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LR-${locationCode}-${typeCode}-${randomCode}`;
  }, [lrCounter, bookingData.from_location.code, bookingData.lr_type]);
  


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

  const handleSenderChange = async (field, value) => {
    setBookingData(prev => ({
      ...prev,
      sender: { ...prev.sender, [field]: value }
    }));

    // Auto-update customer in database if it exists and fields are complete
    if (bookingData.sender.customer_id && field !== 'gst_number') {
      const updatedSender = { ...bookingData.sender, [field]: value };
      if (updatedSender.name && updatedSender.phone && updatedSender.address) {
        // Use debounced update to avoid too many API calls
        debouncedUpdateCustomer(bookingData.sender.customer_id, {
          name: updatedSender.name,
          phone: updatedSender.phone,
          address: updatedSender.address,
          gst_number: updatedSender.gst_number || ""
        });
      }
    }
  };

  const handleReceiverChange = async (field, value) => {
    setBookingData(prev => ({
      ...prev,
      receiver: { ...prev.receiver, [field]: value }
    }));

    // Auto-update customer in database if it exists and fields are complete
    if (bookingData.receiver.customer_id && field !== 'gst_number') {
      const updatedReceiver = { ...bookingData.receiver, [field]: value };
      if (updatedReceiver.name && updatedReceiver.phone && updatedReceiver.address) {
        // Use debounced update to avoid too many API calls
        debouncedUpdateCustomer(bookingData.receiver.customer_id, {
          name: updatedReceiver.name,
          phone: updatedReceiver.phone,
          address: updatedReceiver.address,
          gst_number: updatedReceiver.gst_number || ""
        });
      }
    }
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
    
    // Validate required fields including from_location
    if (!bookingData.from_location.location_id || !bookingData.from_location.name || !bookingData.from_location.code) {
      console.error('❌ From location validation failed:', bookingData.from_location);
      
      // Try to recover by re-fetching the agent's location
      try {
        console.log('🔄 Attempting to recover from_location...');
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user && data.user.location) {
              const locationName = data.user.location.split(' (')[0];
              const locationResponse = await fetch(`${API_BASE_URL}/api/locations?search=${encodeURIComponent(locationName)}`);
              
              if (locationResponse.ok) {
                const locations = await locationResponse.json();
                const agentLocationData = locations.find(loc => loc.name === locationName);
                
                if (agentLocationData) {
                  setBookingData(prev => ({
                    ...prev,
                    from_location: {
                      location_id: agentLocationData._id,
                      name: agentLocationData.name.toUpperCase(),
                      code: agentLocationData.code,
                      address: agentLocationData.address || ''
                    }
                  }));
                  console.log('✅ From location recovered:', agentLocationData);
                  
                  // Continue with the booking submission
                } else {
                  alert('Agent location not properly set. Please refresh the page or contact admin.');
                  return;
                }
              } else {
                alert('Agent location not properly set. Please refresh the page or contact admin.');
                return;
              }
            } else {
              alert('Agent location not properly set. Please refresh the page or contact admin.');
              return;
            }
          } else {
            alert('Agent location not properly set. Please refresh the page or contact admin.');
            return;
          }
        } else {
          alert('Agent location not properly set. Please refresh the page or contact admin.');
          return;
        }
      } catch (error) {
        console.error('Error recovering from_location:', error);
        alert('Agent location not properly set. Please refresh the page or contact admin.');
        return;
      }
    }
    
    if (!bookingData.to_location.location_id || !bookingData.sender.name || !bookingData.receiver.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (bookingData.items.length === 0 || !bookingData.items[0].description) {
      alert('Please add at least one item');
      return;
    }

    // Validate that all items have required fields
    for (let i = 0; i < bookingData.items.length; i++) {
      const item = bookingData.items[i];
      if (!item.description || !item.quantity || item.quantity < 1 || !item.freight_charge || item.freight_charge <= 0) {
        alert(`Please fill in all required fields for item ${i + 1}: Description, Quantity (minimum 1), and Freight Charge (greater than 0)`);
        return;
      }
    }

          // Create customers if they don't exist
      let senderCustomerId = bookingData.sender.customer_id;
      let receiverCustomerId = bookingData.receiver.customer_id;

      // Create sender customer if new (excluding GST)
      let senderCustomerCreated = false;
      if (!senderCustomerId && bookingData.sender.name && bookingData.sender.phone && bookingData.sender.address) {
        try {
          console.log('🔄 Creating new sender customer...');
          const senderResponse = await fetch(`${API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: bookingData.sender.name,
              phone: bookingData.sender.phone,
              address: bookingData.sender.address,
              gst_number: "" // GST is optional, not required
            })
          });
          
          if (senderResponse.ok) {
            const senderCustomer = await senderResponse.json();
            senderCustomerId = senderCustomer._id;
            senderCustomerCreated = true;
            
            // Validate that we got a proper ObjectId
            if (!senderCustomer._id || typeof senderCustomer._id !== 'string' || senderCustomer._id.length < 10) {
              console.error('❌ Invalid sender customer ID received:', senderCustomer._id);
              alert('Error: Failed to create sender customer. Please try again.');
              return;
            }
            
            // Update the bookingData state with the new customer ID
            setBookingData(prev => ({
              ...prev,
              sender: { ...prev.sender, customer_id: senderCustomer._id }
            }));
            
            // Add new customer to local state for immediate dropdown update
            setCustomers(prev => [...prev, senderCustomer]);
            
            console.log('✅ Sender customer created with ID:', senderCustomer._id);
          } else {
            console.error('❌ Failed to create sender customer:', senderResponse.status, senderResponse.statusText);
            alert('Error: Failed to create sender customer. Please try again.');
            return;
          }
        } catch (error) {
          console.error('Error creating sender customer:', error);
          alert('Error: Failed to create sender customer. Please try again.');
          return;
        }
      }

      // Create receiver customer if new (excluding GST)
      let receiverCustomerCreated = false;
      if (!receiverCustomerId && bookingData.receiver.name && bookingData.receiver.phone && bookingData.receiver.address) {
        try {
          console.log('🔄 Creating new receiver customer...');
          const receiverResponse = await fetch(`${API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: bookingData.receiver.name,
              phone: bookingData.receiver.phone,
              address: bookingData.receiver.address,
              gst_number: "" // GST is optional, not required
            })
          });
          
          if (receiverResponse.ok) {
            const receiverCustomer = await receiverResponse.json();
            receiverCustomerId = receiverCustomer._id;
            receiverCustomerCreated = true;
            
            // Validate that we got a proper ObjectId
            if (!receiverCustomer._id || typeof receiverCustomer._id !== 'string' || receiverCustomer._id.length < 10) {
              console.error('❌ Invalid receiver customer ID received:', receiverCustomer._id);
              alert('Error: Failed to create receiver customer. Please try again.');
              return;
            }
            
            // Update the bookingData state with the new customer ID
            setBookingData(prev => ({
              ...prev,
              receiver: { ...prev.receiver, customer_id: receiverCustomer._id }
            }));
            
            // Add new customer to local state for immediate dropdown update
            setCustomers(prev => [...prev, receiverCustomer]);
            
            console.log('✅ Receiver customer created with ID:', receiverCustomer._id);
          } else {
            console.error('❌ Failed to create receiver customer:', receiverResponse.status, receiverResponse.statusText);
            alert('Error: Failed to create receiver customer. Please try again.');
            return;
          }
        } catch (error) {
          console.error('Error creating receiver customer:', error);
          alert('Error: Failed to create receiver customer. Please try again.');
          return;
        }
      }
    
      // Validate that customer IDs are properly set
      if (!senderCustomerId || !receiverCustomerId) {
        console.error('❌ Customer IDs not properly set:', { senderCustomerId, receiverCustomerId });
        alert('Error: Customer information not properly saved. Please try again.');
        return;
      }
      
      console.log('✅ Customer IDs validated:', { senderCustomerId, receiverCustomerId });
      
      // Validate agent authentication
      console.log('🔐 Checking user authentication:', { user, userId: user?.id });
      if (!user?.id) {
        console.error('❌ User not authenticated:', user);
        alert('Please login to create a booking');
        return;
      }
      console.log('✅ User authenticated successfully:', user.name);

      // Debug: Log the from_location data before submission
      console.log('🔍 From location data before submission:', {
        from_location: bookingData.from_location,
        agentLocation: agentLocation,
        user: user
      });
      
      // Prepare booking data with agent info
    const bookingDataWithAgent = {
      ...bookingData,
        sender: { ...bookingData.sender, customer_id: senderCustomerId },
        receiver: { ...bookingData.receiver, customer_id: receiverCustomerId },
        agent_id: user.id,
        agent_location: agentLocation,
        status: "booked"
      };
      
      // Debug: Log the final booking data being sent
      console.log('📤 Final booking data being sent to API:', {
        sender_customer_id: bookingDataWithAgent.sender.customer_id,
        receiver_customer_id: bookingDataWithAgent.receiver.customer_id,
        agent_id: bookingDataWithAgent.agent_id,
        from_location: bookingDataWithAgent.from_location
      });
      
      // Final validation: Ensure all required fields are properly set
      if (!bookingDataWithAgent.sender.customer_id || !bookingDataWithAgent.receiver.customer_id) {
        console.error('❌ Final validation failed - customer IDs missing:', {
          sender_customer_id: bookingDataWithAgent.sender.customer_id,
          receiver_customer_id: bookingDataWithAgent.receiver.customer_id
        });
        alert('Error: Customer information not properly set. Please try again.');
        return;
      }
      
      console.log('✅ Final validation passed - all customer IDs are set');
    
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
        
        // Generate LR number and show success modal
        const newLrNumber = generateLRNumber();
        setLrNumber(newLrNumber);
        setCurrentBooking({
          ...bookingDataWithAgent,
          lr_number: newLrNumber,
          sender: { ...bookingData.sender, customer_id: senderCustomerId },
          receiver: { ...bookingData.receiver, customer_id: receiverCustomerId }
        });
        setShowSuccessModal(true);
        
        // Clear temporary customer data from localStorage
        localStorage.removeItem('temp_sender_data');
        localStorage.removeItem('temp_receiver_data');
        
        // Refresh customers list to ensure all new customers are loaded
        fetchMasterData();
          
          // Reset form but preserve from_location (agent's location)
          const currentFromLocation = bookingData.from_location;
          setBookingData({
            lr_type: "to_pay",
            from_location: {
              location_id: currentFromLocation.location_id || "",
              name: currentFromLocation.name || "",
              code: currentFromLocation.code || "",
              address: currentFromLocation.address || ""
            },
            to_location: {
              location_id: "",
              name: "",
              code: "",
              address: ""
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

  // Debounced update function to avoid too many API calls
  const debouncedUpdateCustomer = useCallback((customerId, customerData) => {
    // Clear any existing timeout
    if (window.customerUpdateTimeout) {
      clearTimeout(window.customerUpdateTimeout);
    }
    
    // Set new timeout
    window.customerUpdateTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerData)
        });
        
        if (response.ok) {
          const updatedCustomer = await response.json();
          // Update local customers state
          setCustomers(prev => prev.map(cust => 
            cust._id === updatedCustomer._id ? updatedCustomer : cust
          ));
          console.log('Customer updated in database:', updatedCustomer);
        }
      } catch (error) {
        console.error('Error updating customer:', error);
      }
    }, 1000); // 1 second delay
  }, []);

  // Format amount to show clean numbers without unnecessary decimals
  const formatAmount = (amount) => {
    if (amount === 0 || amount === null || amount === undefined) return "0";
    if (Number.isInteger(amount)) return amount.toString();
    return parseFloat(amount).toFixed(2).replace(/\.?0+$/, '');
  };

  // Print LR function
  const printLR = () => {
    const printContent = document.getElementById('lr-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>LR - ${currentBooking?.lr_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .lr-content { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { font-size: 28px; font-weight: bold; margin: 0; }
              .lr-details { border: 2px solid #000; padding: 15px; margin-bottom: 30px; }
              .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
              .border-box { border: 1px solid #ccc; padding: 15px; }
              .items-table { border: 1px solid #ccc; margin-bottom: 30px; }
              .items-header { background: #f5f5f5; padding: 10px; border-bottom: 1px solid #ccc; font-weight: bold; }
              .items-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; padding: 10px; border-bottom: 1px solid #eee; }
              .items-row:last-child { border-bottom: none; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .space-y-1 > * + * { margin-top: 5px; }
              .border-t { border-top: 1px solid #ccc; }
              .pt-1 { padding-top: 5px; }
              .pt-2 { padding-top: 10px; }
              .mb-2 { margin-bottom: 10px; }
              .mb-6 { margin-bottom: 30px; }
              .mt-1 { margin-top: 5px; }
              .mt-2 { margin-top: 10px; }
              .p-3 { padding: 15px; }
              .p-8 { padding: 40px; }
              .max-w-4xl { max-width: 896px; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .bg-white { background-color: white; }
              .text-gray-800 { color: #1f2937; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-500 { color: #6b7280; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .border-gray-300 { border-color: #d1d5db; }
              .border-gray-200 { border-color: #e5e7eb; }
              .border-gray-800 { border-color: #1f2937; }
              .border-2 { border-width: 2px; }
              .border { border-width: 1px; }
              .rounded { border-radius: 0.25rem; }
              .inline-block { display: inline-block; }
              .hidden { display: none; }
              @media print {
                body { margin: 0; }
                .lr-content { max-width: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Check if customer exists in the list
  const customerExists = (name, phone) => {
    if (!name) return false;
    return customers.some(customer => 
      customer.name.toLowerCase() === name.toLowerCase() || 
      (phone && customer.phone === phone)
    );
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
        console.log('Locations count:', data.locations?.length); // Debug log
        console.log('Sample locations:', data.locations?.slice(0, 3)); // Debug log
        console.log('Full locations array:', data.locations); // Debug log
        
        if (data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations);
          console.log('Locations state set successfully');
        } else {
          console.error('Locations data is not an array:', data.locations);
          setLocations([]);
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
          setAgentLocation("Hyderabad (HYD)");
          setBookingData(prev => ({
            ...prev,
            from_location: {
              location_id: "default_hyderabad",
              name: "HYDERABAD",
              code: "HYD",
              address: "Hyderabad, Telangana, India"
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
            
            // Extract location name from format "Name (CODE)" for API calls
            const locationName = data.user.location.split(' (')[0];
            console.log('Extracted location name:', locationName);
            
            // Find the location details from the locations collection
            const locationResponse = await fetch(`${API_BASE_URL}/api/locations?search=${encodeURIComponent(locationName)}`);
            if (locationResponse.ok) {
              const locations = await locationResponse.json();
              const agentLocationData = locations.find(loc => loc.name === locationName);
              
              if (agentLocationData) {
                // Set from_location with proper location data including address
                setBookingData(prev => ({
                  ...prev,
                  from_location: {
                    location_id: agentLocationData._id,
                    name: agentLocationData.name.toUpperCase(),
                    code: agentLocationData.code,
                    address: agentLocationData.address || ''
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
                      name: fallbackLocation.name.toUpperCase(),
                      code: fallbackLocation.code,
                      address: fallbackLocation.address || ''
                    }
                  }));
                  setAgentLocation("Hyderabad (HYD)"); // Update UI to show fallback
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
                        name: hyderabadLocation.name.toUpperCase(),
                        code: hyderabadLocation.code,
                        address: hyderabadLocation.address || ''
                      }
                    }));
                    setAgentLocation("Hyderabad (HYD)");
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
            setAgentLocation("Hyderabad (HYD)");
            setBookingData(prev => ({
              ...prev,
              from_location: {
                location_id: "default_hyderabad",
                name: "HYDERABAD",
                code: "HYD"
              }
            }));
          }
        } else {
          console.error('Failed to fetch user profile');
          // Set a default location as fallback
          setAgentLocation("Hyderabad (HYD)");
                      setBookingData(prev => ({
              ...prev,
              from_location: {
                location_id: "default_hyderabad",
                name: "HYDERABAD",
                code: "HYD"
              }
            }));
        }
      } catch (error) {
        console.error('Error fetching agent location:', error);
        // Set a default location as fallback
        setAgentLocation("Hyderabad (HYD)");
        setBookingData(prev => ({
          ...prev,
          from_location: {
            location_id: "default_hyderabad",
            name: "HYDERABAD",
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

  // Debug: Log locations state changes
  useEffect(() => {
    console.log('Locations state updated:', locations);
  }, [locations]);

  // Ensure from_location is always properly set when agentLocation changes
  useEffect(() => {
    if (agentLocation && agentLocation !== "Hyderabad (HYD)") {
      console.log('🔄 Agent location changed, updating from_location:', agentLocation);
      // Extract location name from format "Name (CODE)" for API calls
      const locationName = agentLocation.split(' (')[0];
      
      // Find the location details from the locations collection
      const findAndSetLocation = async () => {
        try {
          const locationResponse = await fetch(`${API_BASE_URL}/api/locations?search=${encodeURIComponent(locationName)}`);
          if (locationResponse.ok) {
            const locations = await locationResponse.json();
            const agentLocationData = locations.find(loc => loc.name === locationName);
            
            if (agentLocationData) {
              setBookingData(prev => ({
                ...prev,
                from_location: {
                  location_id: agentLocationData._id,
                  name: agentLocationData.name.toUpperCase(),
                  code: agentLocationData.code
                }
              }));
              console.log('✅ From location updated from agentLocation change:', agentLocationData);
            }
          }
        } catch (error) {
          console.error('Error updating from_location from agentLocation:', error);
        }
      };
      
      findAndSetLocation();
    }
  }, [agentLocation]);

  // Debug: Log the current from_location state
  useEffect(() => {
    console.log('🔍 Current from_location state:', bookingData.from_location);
  }, [bookingData.from_location]);

  // Auto-save sender details to localStorage whenever they change (except GST)
  useEffect(() => {
    if (bookingData.sender.name || bookingData.sender.phone || bookingData.sender.address) {
      const senderData = {
        name: bookingData.sender.name || "",
        phone: bookingData.sender.phone || "",
        address: bookingData.sender.address || ""
      };
      localStorage.setItem('temp_sender_data', JSON.stringify(senderData));
    }
  }, [bookingData.sender.name, bookingData.sender.phone, bookingData.sender.address]);

  // Auto-create new customer when sender details are complete (except GST)
  useEffect(() => {
    const createNewCustomer = async () => {
      if (bookingData.sender.name && bookingData.sender.phone && bookingData.sender.address && !bookingData.sender.customer_id) {
        // Check if customer already exists
        const existingCustomer = customers.find(cust => 
          cust.name.toLowerCase() === bookingData.sender.name.toLowerCase() ||
          cust.phone === bookingData.sender.phone
        );
        
        if (!existingCustomer) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/customers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: bookingData.sender.name,
                phone: bookingData.sender.phone,
                address: bookingData.sender.address,
                gst_number: "" // GST is optional
              })
            });
            
            if (response.ok) {
              const newCustomer = await response.json();
              // Add new customer to local state for immediate dropdown update
              setCustomers(prev => [...prev, newCustomer]);
              // Update sender with customer_id
              setBookingData(prev => ({
                ...prev,
                sender: { ...prev.sender, customer_id: newCustomer._id }
              }));
              console.log('New sender customer created:', newCustomer);
              // Refresh master data to ensure new customer is loaded
              fetchMasterData();
            }
          } catch (error) {
            console.error('Error auto-creating sender customer:', error);
          }
        }
      }
    };

    createNewCustomer();
  }, [bookingData.sender.name, bookingData.sender.phone, bookingData.sender.address]);

  // Auto-save receiver details to localStorage whenever they change (except GST)
  useEffect(() => {
    if (bookingData.receiver.name || bookingData.receiver.phone || bookingData.receiver.address) {
      const receiverData = {
        name: bookingData.receiver.name || "",
        phone: bookingData.receiver.phone || "",
        address: bookingData.receiver.address || ""
      };
      localStorage.setItem('temp_receiver_data', JSON.stringify(receiverData));
    }
  }, [bookingData.receiver.name, bookingData.receiver.phone, bookingData.receiver.address]);

  // Auto-create new customer when receiver details are complete (except GST)
  useEffect(() => {
    const createNewCustomer = async () => {
      if (bookingData.receiver.name && bookingData.receiver.phone && bookingData.receiver.address && !bookingData.receiver.customer_id) {
        // Check if customer already exists
        const existingCustomer = customers.find(cust => 
          cust.name.toLowerCase() === bookingData.receiver.name.toLowerCase() ||
          cust.phone === bookingData.receiver.phone
        );
        
        if (!existingCustomer) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/customers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: bookingData.receiver.name,
                phone: bookingData.receiver.phone,
                address: bookingData.receiver.address,
                gst_number: "" // GST is optional
              })
            });
            
            if (response.ok) {
              const newCustomer = await response.json();
              // Add new customer to local state for immediate dropdown update
              setCustomers(prev => [...prev, newCustomer]);
              // Update receiver with customer_id
              setBookingData(prev => ({
                ...prev,
                receiver: { ...prev.receiver, customer_id: newCustomer._id }
              }));
              console.log('New receiver customer created:', newCustomer);
              // Refresh master data to ensure new customer is loaded
              fetchMasterData();
            }
          } catch (error) {
            console.error('Error auto-creating receiver customer:', error);
          }
        }
      }
    };

    createNewCustomer();
  }, [bookingData.receiver.name, bookingData.receiver.phone, bookingData.receiver.address]);

  // Smart auto-population: suggest sender name in receiver field only for new customers
  useEffect(() => {
    if (bookingData.sender.name && !bookingData.receiver.name) {
      // Check if sender is a newly created customer (no customer_id means it's new)
      const isNewSender = !bookingData.sender.customer_id;
      
      if (isNewSender) {
        // Only suggest sender name if it's a new customer
        console.log('Suggesting new sender name in receiver field:', bookingData.sender.name);
        // Don't auto-set the value, just prepare it for suggestion
      }
    }
  }, [bookingData.sender.name, bookingData.receiver.name, bookingData.sender.customer_id]);

  // Real-time sync: Update customer data in both sender and receiver when either changes
  useEffect(() => {
    // When sender customer data changes, update the customers list for receiver dropdown
    if (bookingData.sender.customer_id) {
      const senderCustomer = customers.find(cust => cust._id === bookingData.sender.customer_id);
      if (senderCustomer) {
        // Update the customer in the list with current form data
        const updatedCustomer = {
          ...senderCustomer,
          name: bookingData.sender.name,
          phone: bookingData.sender.phone,
          address: bookingData.sender.address
        };
        
        setCustomers(prev => prev.map(cust => 
          cust._id === updatedCustomer._id ? updatedCustomer : cust
        ));
      }
    }
  }, [bookingData.sender.name, bookingData.sender.phone, bookingData.sender.address, bookingData.sender.customer_id]);

  useEffect(() => {
    // When receiver customer data changes, update the customers list for sender dropdown
    if (bookingData.receiver.customer_id) {
      const receiverCustomer = customers.find(cust => cust._id === bookingData.receiver.customer_id);
      if (receiverCustomer) {
        // Update the customer in the list with current form data
        const updatedCustomer = {
          ...receiverCustomer,
          name: bookingData.receiver.name,
          phone: bookingData.receiver.phone,
          address: bookingData.receiver.address
        };
        
        setCustomers(prev => prev.map(cust => 
          cust._id === updatedCustomer._id ? updatedCustomer : cust
        ));
      }
    }
  }, [bookingData.receiver.name, bookingData.receiver.phone, bookingData.receiver.address, bookingData.receiver.customer_id]);



  // Restore customer data from localStorage on component mount
  useEffect(() => {
    const savedSenderData = localStorage.getItem('temp_sender_data');
    const savedReceiverData = localStorage.getItem('temp_receiver_data');
    
    if (savedSenderData) {
      try {
        const senderData = JSON.parse(savedSenderData);
        if (senderData.name || senderData.phone || senderData.address) {
          setBookingData(prev => ({
            ...prev,
            sender: { 
              ...prev.sender, 
              name: senderData.name || prev.sender.name,
              phone: senderData.phone || prev.sender.phone,
              address: senderData.address || prev.sender.address
            }
          }));
        }
      } catch (error) {
        console.error('Error parsing sender data:', error);
      }
    }
    
    if (savedReceiverData) {
      try {
        const receiverData = JSON.parse(savedReceiverData);
        if (receiverData.name || receiverData.phone || receiverData.address) {
          setBookingData(prev => ({
            ...prev,
            receiver: { 
              ...prev.receiver, 
              name: receiverData.name || prev.receiver.name,
              phone: receiverData.phone || prev.receiver.phone,
              address: receiverData.address || prev.receiver.address
            }
          }));
        }
      } catch (error) {
        console.error('Error parsing receiver data:', error);
      }
    }
  }, []);



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
    <div className="h-screen flex bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="agent" />
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <form onSubmit={handleBookingSubmit}>
              {/* Section 1: Booking Metadata - Modern Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5" />
              </div>
                    <h3 className="text-2xl font-bold">Cargo Booking</h3>
              </div>
              </div>
          </div>

              {/* Section 1: Booking Metadata - Form Fields */}
              <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">LR Type *</Label>
                    <Select
                      value={bookingData.lr_type}
                      onValueChange={(value) => handleBookingChange('lr_type', value)}
                    >
                      <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500" data-field-index="0">
                        <SelectValue placeholder="Select LR Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="to_pay">To Pay</SelectItem>
                        <SelectItem value="on_account">On Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">From Location *</Label>
                    <Input
                      value={(agentLocation || "Loading location...").toUpperCase()}
                      className="h-11 bg-white border-gray-300 text-gray-700 font-medium"
                      readOnly
                    />
                  </div>

                  <div id="to-location-field" className="relative space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">To Location *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search or enter location name..."
                        value={searchQuery || (bookingData.to_location.name && bookingData.to_location.code ? `${bookingData.to_location.name.toUpperCase()} (${bookingData.to_location.code.toUpperCase()})` : "") || ""}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchQuery("")}
                        onBlur={() => {
                          setTimeout(() => setSearchQuery(null), 200);
                        }}
                        className="h-11 pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      <Search className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                    
                    {/* Location Dropdown */}
                    {searchQuery !== null && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                        {locations.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No locations available</div>
                        ) : locations
                          .filter(location => 
                            location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            location.code.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map(location => (
                            <div
                              key={location._id}
                              className="px-4 py-3 hover:bg-green-50 active:bg-green-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation transition-colors"
                              onMouseDown={() => {
                                setBookingData(prev => ({
                                  ...prev,
                                  to_location: {
                                    location_id: location._id,
                                    name: location.name.toUpperCase(),
                                    code: location.code,
                                    address: location.address || ''
                                  }
                                }));
                                setSearchQuery(null);
                              }}
                              onTouchStart={() => {
                                setBookingData(prev => ({
                                  ...prev,
                                  to_location: {
                                    location_id: location._id,
                                    name: location.name.toUpperCase(),
                                    code: location.code,
                                    address: location.address || ''
                                  }
                                }));
                                setSearchQuery(null);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span className="font-medium">{location.name.toUpperCase()} ({location.code.toUpperCase()})</span>
                              </div>
                            </div>
                          ))}
            </div>
          )}
        </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Date</Label>
                    <Input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      className="h-11 bg-white border-gray-300 text-gray-700"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parties Involved - Two Side-by-Side Cards */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sender Details Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                  </div>
                      <h4 className="text-xl font-bold text-gray-800">Sender Details</h4>
                </div>
                    <div className="space-y-4">
                      <div id="customer-field" className="relative space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Customer Name *</Label>
                        <div className="relative">
                          <Input
                            placeholder="Search or enter customer name..."
                            value={bookingData.sender.name || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleSenderChange('name', value);
                              setCustomerSearchQuery(value);
                            }}
                            onFocus={() => {
                              setCustomerSearchQuery("");
                            }}
                            onBlur={() => {
                              setTimeout(() => setCustomerSearchQuery(null), 200);
                            }}
                            className="h-11 pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Search className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
                          
                          {/* Customer Dropdown */}
                          {customerSearchQuery !== null && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                              {(() => {
                                let filteredCustomers = customerSearchQuery ? 
                                  customers.filter(cust => 
                                    cust.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                                    cust.phone.includes(customerSearchQuery)
                                  ) : 
                                  customers;
                                
                                filteredCustomers.sort((a, b) => {
                                  if (a._id === bookingData.sender.customer_id) return -1;
                                  if (b._id === bookingData.sender.customer_id) return 1;
                                  return a.name.localeCompare(b.name);
                                });
                                
                                if (filteredCustomers.length > 0) {
                                  return filteredCustomers.map(customer => (
                                    <div
                                      key={customer._id}
                                      className="px-4 py-3 hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation transition-colors"
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
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{customer.name} - {customer.phone}</span>
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                          Existing
                                        </span>
              </div>
                                    </div>
                                  ));
                                } else {
                                  return (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                      <div className="flex items-center justify-between">
                                        <span>No matching customers found</span>
                                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">New customer will be created</span>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}

                          {bookingData.sender.name && !customerExists(bookingData.sender.name, bookingData.sender.phone) && (
                            <div className="absolute -bottom-6 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              ✨ New customer will be created automatically
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Mobile No</Label>
                    <Input
                          placeholder="10 digit mobile number"
                          value={bookingData.sender.phone}
                          onChange={(e) => handleSenderChange('phone', e.target.value)}
                          className="h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">GST Number</Label>
                    <Input
                          placeholder="GST Number"
                          value={bookingData.sender.gst_number}
                          onChange={(e) => handleSenderChange('gst_number', e.target.value)}
                          className="h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Address</Label>
                        <Textarea
                          placeholder="Full address"
                          value={bookingData.sender.address}
                          onChange={(e) => handleSenderChange('address', e.target.value)}
                          className="min-h-[80px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                    </div>
                  </div>

                                    {/* Receiver Details Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Receiver Details</h4>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copySenderToReceiver}
                        className="text-xs border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Sender details
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div id="receiver-customer-field" className="relative space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Customer Name *</Label>
                        <div className="relative">
                    <Input
                            placeholder="Search or enter customer name..."
                            value={bookingData.receiver.name || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleReceiverChange('name', value);
                              setCustomerSearchQueryReceiver(value);
                            }}
                            onFocus={() => {
                              setCustomerSearchQueryReceiver("");
                              
                              if (bookingData.sender.name && !bookingData.sender.customer_id && !bookingData.receiver.name) {
                                // The suggestion will be handled in the dropdown display
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setCustomerSearchQueryReceiver(null), 200);
                            }}
                            className="h-11 pr-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                          <Search className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
                          
                          {/* Customer Dropdown */}
                          {customerSearchQueryReceiver !== null && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                              {(() => {
                                let filteredCustomers = customerSearchQueryReceiver ? 
                                  customers.filter(cust => 
                                    cust.name.toLowerCase().includes(customerSearchQueryReceiver.toLowerCase()) ||
                                    cust.phone.includes(customerSearchQueryReceiver)
                                  ) : 
                                  customers;
                                
                                filteredCustomers.sort((a, b) => {
                                  if (a._id === bookingData.receiver.customer_id) return -1;
                                  if (b._id === bookingData.receiver.customer_id) return 1;
                                  return a.name.localeCompare(b.name);
                                });
                                
                                const shouldShowSenderSuggestion = !customerSearchQueryReceiver && 
                                  bookingData.sender.name && 
                                  !bookingData.sender.customer_id && 
                                  !bookingData.receiver.name;
                                
                                if (filteredCustomers.length > 0 || shouldShowSenderSuggestion) {
                                  return (
                                    <>
                                      {/* Show sender name suggestion if applicable */}
                                      {shouldShowSenderSuggestion && (
                                        <div
                                          className="px-4 py-3 hover:bg-green-50 active:bg-green-100 cursor-pointer text-sm border-b border-gray-100 select-none touch-manipulation bg-green-50 transition-colors"
                                          onMouseDown={() => {
                                            setBookingData(prev => ({
                                              ...prev,
                                              receiver: {
                                                customer_id: "",
                                                name: prev.sender.name,
                                                phone: prev.sender.phone,
                                                gst_number: "",
                                                address: prev.sender.address
                                              }
                                            }));
                                            setCustomerSearchQueryReceiver(null);
                                          }}
                                          onTouchStart={() => {
                                            setBookingData(prev => ({
                                              ...prev,
                                              receiver: {
                                                customer_id: "",
                                                name: prev.sender.name,
                                                phone: prev.sender.phone,
                                                gst_number: "",
                                                address: prev.sender.address
                                              }
                                            }));
                                            setCustomerSearchQueryReceiver(null);
                                          }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{bookingData.sender.name} - {bookingData.sender.phone}</span>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">Copy from Sender</span>
                  </div>
                                        </div>
                                      )}
                                      
                                      {/* Show existing customers */}
                                      {filteredCustomers.map(customer => (
                                        <div
                                          key={customer._id}
                                          className="px-4 py-3 hover:bg-green-50 active:bg-green-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 select-none touch-manipulation transition-colors"
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
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium">{customer.name} - {customer.phone}</span>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                              Existing
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  );
                                } else {
                                  return (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                      <div className="flex items-center justify-between">
                                        <span>No matching customers found</span>
                                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">New customer will be created</span>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}

                          {bookingData.receiver.name && !customerExists(bookingData.receiver.name, bookingData.receiver.phone) && (
                            <div className="absolute -bottom-6 left-0 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              ✨ New customer will be created automatically
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Mobile No</Label>
                    <Input
                          placeholder="10 digit mobile number"
                          value={bookingData.receiver.phone}
                          onChange={(e) => handleReceiverChange('phone', e.target.value)}
                          className="h-11 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">GST Number</Label>
                    <Input
                          placeholder="GST Number"
                          value={bookingData.receiver.gst_number}
                          onChange={(e) => handleReceiverChange('gst_number', e.target.value)}
                          className="h-11 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Address</Label>
                        <Textarea
                          placeholder="Full address"
                          value={bookingData.receiver.address}
                          onChange={(e) => handleReceiverChange('address', e.target.value)}
                          className="min-h-[80px] bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Item List */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Item List</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Item Description</th>
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Quantity *</th>
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Weight (kg)</th>
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Freight Charge (₹) *</th>
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Total (₹)</th>
                        <th className="text-left py-3 px-3 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-3">
                    <Input
                              placeholder="Enter item description"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="h-9 text-sm bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                />
                          </td>
                          <td className="py-3 px-3">
                    <Input
                  type="number"
                              placeholder="0"
                              value={item.quantity || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const intValue = parseInt(value) || 1;
                                handleItemChange(index, 'quantity', intValue);
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                if (value >= 1) {
                                  handleItemChange(index, 'quantity', value);
                                }
                              }}
                              className={`h-9 text-sm w-20 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${
                                !item.quantity || item.quantity < 1 ? 'border-red-300 focus:border-red-500' : ''
                              }`}
                              min="1"
                      required
                />
                          </td>
                          <td className="py-3 px-3">
                    <Input
                  type="number"
                              placeholder="0"
                              value={item.weight}
                              onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                              className="h-9 text-sm w-20 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                              step="0.01"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.freight_charge || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value) || 0;
                                handleItemChange(index, 'freight_charge', numValue);
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (value > 0) {
                                  handleItemChange(index, 'freight_charge', value);
                                }
                              }}
                              className={`h-9 text-sm w-24 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${
                                !item.freight_charge || item.freight_charge <= 0 ? 'border-red-300 focus:border-red-500' : ''
                              }`}
                              step="0.01"
                      required
                />
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                              ₹{formatAmount((item.quantity || 1) * (item.freight_charge || 0))}
                  </div>
                          </td>
                          <td className="py-3 px-3">
                            {bookingData.items.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-9 w-9 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-red-500 font-semibold">*</span> Required fields
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    + Add Item
                  </Button>
                </div>
              </div>

                            {/* Section 4: Charges Summary */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Charges Summary</h4>
                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Item Freight Subtotal (₹)</Label>
                    <Input
                      value={formatAmount(itemFreightSubtotal)}
                      className="h-11 bg-gray-50 border-gray-300 font-semibold text-gray-800"
                      readOnly
                />
              </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Handling Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.handling_charges || ""}
                      onChange={(e) => handleChargesChange('handling_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('handling_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
              </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Book Delivery Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.book_delivery_charges || ""}
                      onChange={(e) => handleChargesChange('book_delivery_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('book_delivery_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Door Delivery Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.door_delivery_charges || ""}
                      onChange={(e) => handleChargesChange('door_delivery_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('door_delivery_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Pickup Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.pickup_charges || ""}
                      onChange={(e) => handleChargesChange('pickup_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('pickup_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">LR Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.lr_charges || ""}
                      onChange={(e) => handleChargesChange('lr_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('lr_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Other Charges (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bookingData.charges.other_charges || ""}
                      onChange={(e) => handleChargesChange('other_charges', e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange('other_charges', value);
                      }}
                      className="h-10"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Total Amount (₹)</Label>
                    <Input
                      value={formatAmount(totalAmount)}
                      className="h-10 bg-red-100 font-bold text-red-900 text-lg"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <Button 
                type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5" />
                    Confirm Cargo Booking
                  </div>
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
                                                📍 Location: <span className="font-medium text-blue-600">{agentLocation.toUpperCase()}</span>
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

        {/* Location Bookings Tab */}
        {activeTab === "location-bookings" && (
          <LocationBookings />
        )}

        {/* Reports Tab - Location-specific reports for agent */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-200 px-4 py-2 rounded mr-4">
                <span className="text-blue-800 font-bold text-sm">LOCATION REPORTS</span>
              </div>
              <span className="text-gray-600 text-sm">Reports for {agentLocation}</span>
            </div>
            
            <LocationBookings showReports={true} />
          </div>
        )}

        {/* Abstract Daily Booking Tab */}
        {activeTab === "abstract" && (
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
        {activeTab === "search" && (
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

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-green-600">Booking Successful!</h3>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Your cargo booking has been confirmed successfully.
              </p>
              
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm font-medium text-gray-700">
                  LR Number: <span className="text-blue-600">{lrNumber}</span>
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    printLR();
                    setShowSuccessModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Print LR
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset form will happen automatically
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Create New Booking
                </Button>
              </div>
            </div>
          </div>
        )}

            {/* LR Print Window */}
    <div id="lr-print-content" className="hidden">
      <div className="max-w-4xl mx-auto p-6 bg-white border-2 border-black font-mono text-sm">
        {/* Header with Logo and Company Name */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
              BAL
            </div>
            <div className="text-center">
              <div className="bg-orange-500 text-white px-4 py-1 rounded text-xs font-bold">
                BALAJI LORRY
              </div>
              <div className="bg-orange-500 text-white px-4 py-1 rounded text-xs font-bold mt-1">
                SERVICE
              </div>
            </div>
          </div>
        </div>

        {/* Company Title */}
        <div className="text-center text-xl font-bold mb-4">
          BALAJI LORRY SERVICE
        </div>

        {/* Branch Address */}
        <div className="text-center text-xs mb-4">
          <div>Branch Address: {currentBooking?.from_location?.name} ({currentBooking?.from_location?.code})</div>
          <div>{currentBooking?.from_location?.address || 'No address available'}</div>
          <div>Ph.No: 0-8919322489 , 9989674524</div>
        </div>

        {/* Receipt Header */}
        <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
          <div className="text-xs">
            <div>Parcel Receipt</div>
            <div className="font-bold">L.R.No: {currentBooking?.lr_number}</div>
          </div>
          <div className="text-xs text-center">
            <div className="font-bold">Date: {new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN')}</div>
          </div>
          <div className="text-xs text-right">
            <div className="font-bold">{currentBooking?.lr_type === 'to_pay' ? 'To-Pay' : currentBooking?.lr_type === 'paid' ? 'Paid' : 'On Account'}</div>
          </div>
        </div>

        {/* Main Receipt Table */}
        <table className="w-full border-collapse border-2 border-black text-xs mb-4">
          <tbody>
            {/* Row 1: Consignor/Consignee Headers */}
            <tr>
              <td className="border border-black p-2 font-bold bg-gray-100">Consignor:</td>
              <td className="border border-black p-2 font-bold bg-gray-100">Consignee:</td>
              <td className="border border-black p-2 font-bold bg-gray-100">Receiver Copy</td>
            </tr>
            
            {/* Row 2: Customer Names and Package Details */}
            <tr>
              <td className="border border-black p-2">{currentBooking?.sender?.name || 'N/A'}</td>
              <td className="border border-black p-2">{currentBooking?.receiver?.name || 'N/A'}</td>
              <td className="border border-black p-2">Pkgs: {currentBooking?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} ({currentBooking?.items?.map(item => `${item.description}(${item.quantity})`).join(', ') || 'N/A'})</td>
            </tr>
            
            {/* Row 3: From/To Locations */}
            <tr>
              <td className="border border-black p-2">
                From: {currentBooking?.from_location?.name} ({currentBooking?.from_location?.code})
                <div className="text-xs mt-1">{currentBooking?.from_location?.address || 'No address'}</div>
              </td>
              <td className="border border-black p-2">
                To: {currentBooking?.to_location?.name} ({currentBooking?.to_location?.code})
                <div className="text-xs mt-1">{currentBooking?.to_location?.address || 'No address'}</div>
              </td>
              <td className="border border-black p-2"></td>
            </tr>
            
            {/* Row 4: Invoice Number and Parcel Value */}
            <tr>
              <td className="border border-black p-2">Invoice Number: {currentBooking?.sender?.gst_number || ''}</td>
              <td className="border border-black p-2">Parcel Value: ₹{formatAmount(currentBooking?.charges?.total_amount || 0)}</td>
              <td className="border border-black p-2"></td>
            </tr>
            
            {/* Row 5: GST Numbers */}
            <tr>
              <td className="border border-black p-2">GST Number: {currentBooking?.sender?.gst_number || ''}</td>
              <td className="border border-black p-2">GST Number: {currentBooking?.receiver?.gst_number || ''}</td>
              <td className="border border-black p-2"></td>
            </tr>
            
            {/* Row 6: Remark */}
            <tr>
              <td className="border border-black p-2" colSpan="2">Remark: {currentBooking?.sender?.address || ''}</td>
              <td className="border border-black p-2"></td>
            </tr>
            
            {/* Row 7: Terms & Conditions + Weight/Financial Table */}
            <tr>
              <td className="border border-black p-2 align-top" colSpan="2">
                <div className="font-bold mb-2">Terms & Conditions:</div>
                <div className="text-xs space-y-1">
                  <div><strong>Customer care No - 8886648719</strong></div>
                  <div><strong>1) LR Valid for 15 days</strong></div>
                  <div><strong>Hyderabad kukatpally - 8886648719</strong></div>
                  <div><strong>2) Booked Owners risk</strong></div>
                  <div><strong>Hyderabad Begam Bazar- 7330963338</strong></div>
                  <div><strong>3) Not Responsible for Breakage and Leakages</strong></div>
                  <div><strong>Hyderabad Katedan -8919322489</strong></div>
                  <div><strong>4) PAN NO: ACZPY9785F</strong></div>
                  <div className="mt-2"><strong>TRANSPORT ID: 36ACZPY9785F1Z7</strong></div>
                </div>
              </td>
              <td className="border border-black p-2 align-top">
                <table className="w-full text-xs">
                  <tr>
                    <td className="font-bold">Weight</td>
                    <td className="text-right">Actual Wt:</td>
                    <td className="text-right">{currentBooking?.items?.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td className="text-right">Charged Wt:</td>
                    <td className="text-right">{currentBooking?.items?.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold border-t border-black pt-2">Freight</td>
                    <td className="text-right border-t border-black pt-2"></td>
                    <td className="text-right border-t border-black pt-2">₹{formatAmount(currentBooking?.charges?.item_freight_subtotal || 0)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold border-t border-black pt-2">Net Amt Payable</td>
                    <td className="text-right border-t border-black pt-2"></td>
                    <td className="text-right border-t border-black pt-2 font-bold">₹{formatAmount(currentBooking?.charges?.total_amount || 0)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Delivery Address */}
        <div className="text-xs mb-4 p-2 border border-black">
          <div>
            <strong>Delivery at:</strong> {currentBooking?.to_location?.name} ({currentBooking?.to_location?.code}) - {currentBooking?.to_location?.address || 'No address available'}
          </div>
          <div className="mt-1">
            <strong>Receiver Details:</strong> {currentBooking?.receiver?.address} <strong>contact: {currentBooking?.receiver?.phone}, 8886648712</strong>
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex justify-end">
          <div className="text-xs text-right">
            <div className="font-bold">Receiver's Signature/Name</div>
            <div className="h-12 w-40 border-b border-black mt-2"></div>
          </div>
        </div>
      </div>
    </div>
        </div>
      </div>
    </div>
  );
}

