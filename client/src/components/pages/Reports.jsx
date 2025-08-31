import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, Filter, Package, MapPin, User, Truck, Calendar, Edit } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  
  // Edit booking state
  const [editingBooking, setEditingBooking] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    fromLocation: "all",
    toLocation: "all",
    agentName: "",
    status: "all"
  });

  // Available locations - will be populated from database
  const [locations, setLocations] = useState([]);
  const statuses = ["all", "booked", "in_transit", "unloaded", "delivered", "cancelled", "rejected"];

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched bookings:', data);
        
        // Populate agent names
        const bookingsWithAgentNames = data.map(booking => {
          const agent = agents.find(a => a._id === booking.agent_id);
          return {
            ...booking,
            agent_name: agent ? agent.name : 'Unknown Agent'
          };
        });
        
        setBookings(bookingsWithAgentNames);
        setFilteredBookings(bookingsWithAgentNames);
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch locations for filters
  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`);
      if (response.ok) {
        const data = await response.json();
        const locationNames = data.map(loc => loc.name);
        setLocations(locationNames);
        console.log('📍 Available locations for filters:', locationNames);
      } else {
        console.error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch agents for name resolution
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        console.log('👥 Fetched agents:', data);
      } else {
        console.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...bookings];

    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) <= new Date(filters.dateTo)
      );
    }

    if (filters.fromLocation && filters.fromLocation !== "all") {
      filtered = filtered.filter(booking => 
        booking.from_location?.name === filters.fromLocation
      );
    }

    if (filters.toLocation && filters.toLocation !== "all") {
      filtered = filtered.filter(booking => 
        booking.to_location?.name === filters.toLocation
      );
    }

    if (filters.agentName) {
      filtered = filtered.filter(booking => {
        const agentName = booking.agent_name || 'Unknown Agent';
        return agentName.toLowerCase().includes(filters.agentName.toLowerCase());
      });
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(booking => 
        booking.status === filters.status
      );
    }

    setFilteredBookings(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      fromLocation: "all",
      toLocation: "all",
      agentName: "",
      status: "all"
    });
    setFilteredBookings(bookings);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "LR Number", "Date", "Agent", "From Location", "To Location", 
      "Sender Company", "Sender Mobile", "Sender GST", "Receiver Company", "Receiver Mobile", "Receiver GST",
      "Material", "Goods Condition", "Quantity", "Weight", "Freight", "Invoice", "Invoice Value",
      "LR Charge", "Handling", "Pickup", "Door Delivery", "Others", "Total Amount", "Status"
    ];

    const csvData = filteredBookings.map(booking => [
      booking.lr_number || "N/A",
      new Date(booking.createdAt || booking.date).toLocaleDateString(),
      booking.agent_name || "N/A",
      (booking.from_location?.name || "N/A").toUpperCase(),
      (booking.to_location?.name || "N/A").toUpperCase(),
      booking.sender?.name || "N/A",
      booking.sender?.phone || "N/A",
      booking.sender?.gst_number || "N/A",
      booking.receiver?.name || "N/A",
      booking.receiver?.phone || "N/A",
      booking.receiver?.gst_number || "N/A",
      booking.items?.[0]?.description || "N/A",
      "N/A", // goodsCondition not in new model
      booking.items?.[0]?.quantity || "N/A",
      booking.items?.[0]?.weight || "N/A",
      booking.items?.[0]?.freight_charge || "N/A",
      "N/A", // invoice not in new model
      "N/A", // invoiceValue not in new model
      booking.charges?.lr_charges || "N/A",
      booking.charges?.handling_charges || "N/A",
      booking.charges?.pickup_charges || "N/A",
      booking.charges?.door_delivery_charges || "N/A",
      booking.charges?.other_charges || "N/A",
      booking.charges?.total_amount || "N/A",
      booking.status || "booked"
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle edit booking - enters edit mode
  const handleEditBooking = (booking) => {
    console.log('📝 Entering edit mode for booking:', booking._id);
    setEditingBooking(booking);
    setEditValue('');
  };

  // Handle edit field
  const handleEditField = (booking, field, value) => {
    if (editingBooking?._id === booking._id) {
      setEditingField(field);
      setEditValue(value);
    }
  };

  // Update field value in state
  const updateFieldValue = (bookingId, field, value) => {
    // Update in main bookings array
    const updatedBookings = bookings.map(b => 
      b._id === bookingId 
        ? { ...b, [field]: value }
        : b
    );
    setBookings(updatedBookings);
    
    // Update in filtered bookings array
    const updatedFilteredBookings = filteredBookings.map(b => 
      b._id === bookingId 
        ? { ...b, [field]: value }
        : b
    );
    setFilteredBookings(updatedFilteredBookings);
  };

  // Save edited field
  const handleSaveField = async (booking, field, value) => {
    try {
      console.log('💾 Saving field:', field, 'with value:', value, 'for booking:', booking._id);
      
      // Update the booking in state immediately for UI responsiveness
      const updatedBookings = bookings.map(b => 
        b._id === booking._id 
          ? { ...b, [field]: value }
          : b
      );
      setBookings(updatedBookings);
      
      // Update filtered bookings as well
      const updatedFilteredBookings = filteredBookings.map(b => 
        b._id === booking._id 
          ? { ...b, [field]: value }
          : b
      );
      setFilteredBookings(updatedFilteredBookings);
      
      // Clear editing state
      setEditingField(null);
      setEditValue('');
      
      alert(`Field ${field} updated successfully!`);
    } catch (error) {
      console.error('❌ Error saving field:', error);
      alert(`Error saving: ${error.message}`);
    }
  };

  // Save all changes to database
  const handleSaveAllChanges = async (booking) => {
    try {
      console.log('💾 Saving all changes for booking:', booking._id);
      
      // Get the updated booking data from state
      const updatedBooking = bookings.find(b => b._id === booking._id);
      if (!updatedBooking) {
        throw new Error('Updated booking not found in state');
      }

      // Prepare the data to send to API
      const updateData = {
        lr_number: updatedBooking.lr_number,
        status: updatedBooking.status,
        // Add more fields as needed
      };

      console.log('📤 Sending update data:', updateData);

      // Call API to update booking in database
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update booking');
      }

      const result = await response.json();
      console.log('✅ Booking updated successfully:', result);

      // Clear editing state
      setEditingBooking(null);
      setEditingField(null);
      setEditValue('');

      alert('Booking updated successfully in database!');
      
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      alert(`Error saving to database: ${error.message}`);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditingField(null);
    setEditValue('');
  };

  // Load bookings, locations, and agents on component mount
  useEffect(() => {
    fetchBookings();
    fetchLocations();
    fetchAgents();
  }, []);

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, bookings]);

  // Re-populate agent names when agents are fetched
  useEffect(() => {
    if (agents.length > 0 && bookings.length > 0) {
      const bookingsWithAgentNames = bookings.map(booking => {
        const agent = agents.find(a => a._id === booking.agent_id);
        return {
          ...booking,
          agent_name: agent ? agent.name : 'Unknown Agent'
        };
      });
      setBookings(bookingsWithAgentNames);
      setFilteredBookings(bookingsWithAgentNames);
    }
  }, [agents]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600 mt-2">View and analyze all booking data from agents</p>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter bookings by date, location, agent, and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">From Location</Label>
                <Select
                  value={filters.fromLocation}
                  onValueChange={(value) => setFilters({...filters, fromLocation: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">To Location</Label>
                <Select
                  value={filters.toLocation}
                  onValueChange={(value) => setFilters({...filters, toLocation: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Agent Name</Label>
                <Input
                  type="text"
                  placeholder="Search by agent"
                  value={filters.agentName}
                  onChange={(e) => setFilters({...filters, agentName: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={resetFilters} variant="outline">
                Reset Filters
              </Button>
              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookings Report</CardTitle>
            <CardDescription>
              Showing {filteredBookings.length} of {bookings.length} total bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No bookings found matching the current filters.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto max-w-full">
                  <Table className="min-w-full">
                                         <TableHeader>
                       <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">LR</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Date</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Agent</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Route</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">Sender</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">Receiver</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Material</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Qty/Wt</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Freight</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Total</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Status</TableHead>
                         <TableHead className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                                         <TableBody className="bg-white divide-y divide-gray-200">
                                              {filteredBookings.map((booking) => (
                         <TableRow key={booking._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                           <TableCell className="px-2 py-2 font-medium text-gray-900 text-xs">
                             {editingBooking?._id === booking._id && editingField === 'lr_number' ? (
                               <div className="flex items-center gap-1">
                                 <Input
                                   value={editValue}
                                   onChange={(e) => setEditValue(e.target.value)}
                                   className="h-6 px-1 text-xs"
                                   autoFocus
                                 />
                                 <button
                                   onClick={() => {
                                     updateFieldValue(booking._id, 'lr_number', editValue);
                                     setEditingField(null);
                                     setEditValue('');
                                   }}
                                   className="h-5 w-5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                 >
                                   ✓
                                 </button>
                                 <button
                                   onClick={handleCancelEdit}
                                   className="h-5 w-5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                 >
                                   ✕
                                 </button>
                               </div>
                             ) : (
                               <div 
                                 className="cursor-pointer hover:bg-blue-50 px-1 rounded"
                                 onClick={() => handleEditField(booking, 'lr_number', booking.lr_number || '')}
                                 title="Click to edit"
                               >
                                 {booking.lr_number || "N/A"}
                               </div>
                             )}
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600 text-xs">
                             {new Date(booking.createdAt || booking.date).toLocaleDateString()}
                           </TableCell>
                           <TableCell className="px-2 py-2">
                             <div className="flex items-center gap-1">
                               <User className="w-3 h-3 text-purple-600" />
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 truncate max-w-16">
                                 {booking.agent_name || "N/A"}
                               </span>
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2">
                             <div className="flex items-center gap-1">
                               <MapPin className="w-3 h-3 text-blue-600" />
                               <div className="text-xs">
                                 <div className="font-medium text-gray-900 truncate max-w-24">
                                   {(booking.from_location?.name || "N/A").toUpperCase()}
                                 </div>
                                 <div className="text-gray-500 text-center">→</div>
                                 <div className="font-medium text-gray-900 truncate max-w-24">
                                   {(booking.to_location?.name || "N/A").toUpperCase()}
                                 </div>
                               </div>
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600">
                             <div className="text-xs">
                               <div className="font-medium truncate max-w-20">{booking.sender?.name || "N/A"}</div>
                               <div className="truncate max-w-20">{booking.sender?.phone || "N/A"}</div>
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600">
                             <div className="text-xs">
                               <div className="font-medium truncate max-w-20">{booking.receiver?.name || "N/A"}</div>
                               <div className="truncate max-w-20">{booking.receiver?.phone || "N/A"}</div>
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600">
                             <div className="text-xs truncate max-w-16" title={booking.items?.[0]?.description || "N/A"}>
                               {booking.items?.[0]?.description || "N/A"}
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600">
                             <div className="text-xs">
                               <div>Qty: {booking.items?.[0]?.quantity || "N/A"}</div>
                               <div>Wt: {booking.items?.[0]?.weight || "N/A"}</div>
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 text-gray-600">
                             <div className="text-xs">
                               ₹{parseFloat(booking.items?.[0]?.freight_charge || 0).toLocaleString()}
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2 font-medium text-gray-900">
                             <div className="text-xs">
                               ₹{parseFloat(booking.charges?.total_amount || 0).toLocaleString()}
                             </div>
                           </TableCell>
                           <TableCell className="px-2 py-2">
                             {editingBooking?._id === booking._id && editingField === 'status' ? (
                               <div className="flex items-center gap-1">
                                 <Select value={editValue} onValueChange={setEditValue}>
                                   <SelectTrigger className="h-6 px-1 text-xs">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="booked">Booked</SelectItem>
                                     <SelectItem value="in_transit">In Transit</SelectItem>
                                     <SelectItem value="unloaded">Unloaded</SelectItem>
                                     <SelectItem value="delivered">Delivered</SelectItem>
                                     <SelectItem value="cancelled">Cancelled</SelectItem>
                                     <SelectItem value="rejected">Rejected</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <button
                                   onClick={() => {
                                     updateFieldValue(booking._id, 'status', editValue);
                                     setEditingField(null);
                                     setEditValue('');
                                   }}
                                   className="h-5 w-5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                 >
                                   ✓
                                 </button>
                                 <button
                                   onClick={handleCancelEdit}
                                   className="h-5 w-5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                 >
                                   ✕
                                 </button>
                               </div>
                             ) : (
                               <div 
                                 className="cursor-pointer hover:bg-blue-50 px-1 rounded"
                                 onClick={() => handleEditField(booking, 'status', booking.status || 'booked')}
                                 title="Click to edit"
                               >
                                 <span className={cn(
                                   "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium",
                                   booking.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                   booking.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                   booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                   booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                   booking.status === 'unloaded' ? 'bg-orange-100 text-orange-800' :
                                   'bg-yellow-100 text-yellow-800'
                                 )}>
                                   {booking.status || 'booked'}
                                 </span>
                               </div>
                             )}
                           </TableCell>
                           <TableCell className="px-2 py-2">
                             <div className="flex items-center gap-1">
                               {editingBooking?._id === booking._id ? (
                                 <div className="flex items-center gap-1">
                                   <button
                                     onClick={() => handleSaveAllChanges(booking)}
                                     className="h-6 px-2 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                   >
                                     ✓ Save
                                   </button>
                                   <button
                                     onClick={handleCancelEdit}
                                     className="h-6 px-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                   >
                                     ✕ Cancel
                                   </button>
                                 </div>
                               ) : (
                                 <button
                                   onClick={() => handleEditBooking(booking)}
                                   className="h-6 px-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                 >
                                   <Edit className="w-3 h-3 mr-1 inline" />
                                   Edit
                                 </button>
                               )}
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
