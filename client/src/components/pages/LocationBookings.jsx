import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Custom table components using existing UI components
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  MapPin,
  User,
  Package,
  Calendar,
  Truck,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE_URL = 'http://localhost:8001';

export default function LocationBookings({ showReports = false }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentLocation, setAgentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch agent's location and bookings
  useEffect(() => {
    const fetchAgentLocationAndBookings = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        // Get agent profile to find their location
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
                  if (profileData.user && profileData.user.location) {
          const locationName = profileData.user.location.split(' (')[0];
          console.log('📍 Agent location from profile:', profileData.user.location);
          console.log('📍 Extracted location name:', locationName);
          setAgentLocation(locationName);
          
          // Fetch all bookings from this location
          await fetchLocationBookings(locationName);
        } else {
          console.log('⚠️ No location found in agent profile:', profileData.user);
        }
        }
      } catch (error) {
        console.error('Error fetching agent location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentLocationAndBookings();
  }, []);

  const fetchLocationBookings = async (locationName) => {
    try {
      console.log('🔍 Fetching bookings for location:', locationName);
      console.log('🔍 API URL:', `${API_BASE_URL}/api/bookings`);
      
      const response = await fetch(`${API_BASE_URL}/api/bookings`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const allBookings = await response.json();
        console.log('📊 Total bookings fetched:', allBookings.length);
        
        // Log sample booking structure
        if (allBookings.length > 0) {
          console.log('📋 Sample booking structure:', {
            lr_number: allBookings[0].lr_number,
            from_location: allBookings[0].from_location,
            to_location: allBookings[0].to_location,
            agent_location: allBookings[0].agent_location,
            status: allBookings[0].status
          });
        }
        
        // Filter bookings by location (both from and to)
        const locationBookings = allBookings.filter(booking => {
          const fromLocation = booking.from_location?.name;
          const toLocation = booking.to_location?.name;
          const agentLocation = booking.agent_location;
          
          // Normalize location names for comparison (remove codes, trim, lowercase)
          const normalizeLocation = (loc) => {
            if (!loc) return '';
            return loc.split(' (')[0].trim().toLowerCase();
          };
          
          const normalizedAgentLocation = normalizeLocation(locationName);
          const normalizedFromLocation = normalizeLocation(fromLocation);
          const normalizedToLocation = normalizeLocation(toLocation);
          const normalizedAgentLocationField = normalizeLocation(agentLocation);
          
          // Check if any of the location fields match the agent's assigned location
          const isLocationMatch = 
            normalizedFromLocation === normalizedAgentLocation || 
            normalizedToLocation === normalizedAgentLocation || 
            normalizedAgentLocationField === normalizedAgentLocation ||
            // Fallback: Check if the agent's location is contained in any of the location fields
            (fromLocation && fromLocation.toLowerCase().includes(locationName.toLowerCase())) ||
            (toLocation && toLocation.toLowerCase().includes(locationName.toLowerCase())) ||
            (agentLocation && agentLocation.toLowerCase().includes(locationName.toLowerCase()));
          
          // Debug logging for first few bookings
          if (allBookings.indexOf(booking) < 3) {
            console.log('🔍 Booking location check:', {
              lr: booking.lr_number,
              from: fromLocation,
              to: toLocation,
              agent: agentLocation,
              agentAssigned: locationName,
              normalizedFrom: normalizedFromLocation,
              normalizedTo: normalizedToLocation,
              normalizedAgent: normalizedAgentLocationField,
              normalizedAgentAssigned: normalizedAgentLocation,
              isMatch: isLocationMatch
            });
          }
          
          return isLocationMatch;
        });
        
        console.log('📍 Location bookings found:', locationBookings.length);
        console.log('📍 Sample location booking:', locationBookings[0]);
        
        // Log unique locations in the system for debugging
        const uniqueLocations = [...new Set([
          ...allBookings.map(b => b.from_location?.name).filter(Boolean),
          ...allBookings.map(b => b.to_location?.name).filter(Boolean),
          ...allBookings.map(b => b.agent_location).filter(Boolean)
        ])];
        console.log('🌍 Unique locations in system:', uniqueLocations);
        console.log('🎯 Agent assigned location:', locationName);
        
        // Additional debugging: Show all bookings with their locations
        console.log('📋 All bookings with locations:');
        allBookings.forEach((booking, index) => {
          if (index < 5) { // Show first 5 bookings
            console.log(`  ${index + 1}. LR: ${booking.lr_number}, From: ${booking.from_location?.name}, To: ${booking.to_location?.name}, Agent: ${booking.agent_location}`);
          }
        });
        
        setBookings(locationBookings);
        setFilteredBookings(locationBookings);
      }
    } catch (error) {
      console.error('Error fetching location bookings:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.lr_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.receiver?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.from_location?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.to_location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (dateFilter === 'today') {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
          return bookingDate === todayStr;
        });
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(booking => new Date(booking.createdAt) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(booking => new Date(booking.createdAt) >= monthAgo);
      }
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const formatAmount = (amount) => {
    if (amount === 0 || amount === null || amount === undefined) return "0";
    if (Number.isInteger(amount)) return amount.toString();
    return parseFloat(amount).toFixed(2).replace(/\.?0+$/, '');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'LR Number', 'Date', 'From', 'To', 'Sender', 'Receiver', 
      'Status', 'Agent', 'Total Amount', 'Items'
    ];

    const csvData = filteredBookings.map(booking => [
      booking.lr_number || 'N/A',
      formatDate(booking.createdAt),
      `${booking.from_location?.name} (${booking.from_location?.code})`,
      `${booking.to_location?.name} (${booking.to_location?.code})`,
      booking.sender?.name || 'N/A',
      booking.receiver?.name || 'N/A',
      booking.status || 'N/A',
      booking.agent_name || 'N/A',
      formatAmount(booking.charges?.total_amount || 0),
      booking.items?.map(item => `${item.description}(${item.quantity})`).join(', ') || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_bookings_${agentLocation}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading location bookings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Debug Info - Always show for now */}
      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <div><strong>Agent Location:</strong> {agentLocation || 'Not set'}</div>
          <div><strong>Total Bookings:</strong> {bookings.length}</div>
          <div><strong>Filtered Bookings:</strong> {filteredBookings.length}</div>
          <div><strong>Show Reports:</strong> {showReports ? 'Yes' : 'No'}</div>
        </div>
      </div> */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {showReports ? 'Location Reports' : 'Location Bookings'}
          </h1>
          <p className="text-gray-600 mt-2">
            {showReports ? 'Reports and analytics for ' : 'All bookings from '}
            <span className="font-semibold text-blue-600">{agentLocation}</span> location
            {bookings.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({bookings.length} bookings found)
              </span>
            )}
          </p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredBookings.filter(b => b.status === 'in_transit').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredBookings.filter(b => {
                    const today = new Date().toISOString().split('T')[0];
                    const bookingDate = new Date(b.createdAt).toISOString().split('T')[0];
                    return bookingDate === today;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredBookings.map(b => b.agent_name).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Reports Cards when showReports is true */}
        {showReports && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{filteredBookings.reduce((sum, b) => sum + (parseFloat(b.charges?.total_amount) || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredBookings.filter(b => b.status === 'delivered').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {filteredBookings.filter(b => b.status === 'booked').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {filteredBookings.filter(b => {
                        const today = new Date();
                        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        return new Date(b.createdAt) >= monthStart;
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search LR, sender, receiver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Bookings Table */}
       <Card>
         <CardHeader>
           <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="rounded-md border overflow-hidden">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-32">LR Number</TableHead>
                     <TableHead className="w-24">Date</TableHead>
                     <TableHead className="w-48">From → To</TableHead>
                     <TableHead className="w-40">Sender</TableHead>
                     <TableHead className="w-40">Receiver</TableHead>
                     <TableHead className="w-32">Agent</TableHead>
                     <TableHead className="w-28">Status</TableHead>
                     <TableHead className="w-24">Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {currentBookings.map((booking) => (
                     <TableRow key={booking._id}>
                       <TableCell className="font-medium">
                         {booking.lr_number || 'N/A'}
                       </TableCell>
                       <TableCell>
                         {formatDate(booking.createdAt)}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-blue-600" />
                           <div className="text-sm">
                             <div className="font-medium text-gray-900">
                               {booking.from_location?.name} ({booking.from_location?.code})
                             </div>
                             <div className="text-gray-500">→</div>
                             <div className="font-medium text-gray-900">
                               {booking.to_location?.name} ({booking.to_location?.code})
                             </div>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           <div className="font-medium text-gray-900">{booking.sender?.name || 'N/A'}</div>
                           <div className="text-gray-500">{booking.sender?.phone || ''}</div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           <div className="font-medium text-gray-900">{booking.receiver?.name || 'N/A'}</div>
                           <div className="text-gray-500">{booking.receiver?.phone || ''}</div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-gray-600" />
                           <span className="text-sm font-medium text-gray-900">
                             {booking.agent_name || 'N/A'}
                           </span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <span className={cn(
                           "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                           getStatusColor(booking.status)
                         )}>
                           {booking.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                         </span>
                       </TableCell>
                       <TableCell className="font-medium">
                         ₹{formatAmount(booking.charges?.total_amount || 0)}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
