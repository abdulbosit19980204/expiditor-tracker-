'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Search, MapPin, Clock, User, BarChart3, Eye, ChevronUp, ChevronDown, ArrowUpDown, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { YandexMap } from '@/components/yandex-map';
import Link from 'next/link';

interface CheckLocation {
  id: number;
  check_id: string;
  client_name: string;
  lat: number;
  lng: number;
  time: string;
  expeditor: string;
  status: string;
  address: string;
}

interface AnalyticsData {
  id: number;
  window_start: string;
  window_end: string;
  window_duration_minutes: number;
  center_lat: number;
  center_lon: number;
  radius_meters: number;
  total_checks: number;
  unique_expiditors: number;
  most_active_expiditor: string;
  most_active_count: number;
  avg_checks_per_expiditor: number;
  analysis_date: string;
  time_window_display: string;
  area_display: string;
  check_ids: number[];
  check_details: any[];
  check_locations: CheckLocation[];
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  expiditor: string;
  minChecks: string;
  maxChecks: string;
  radius: string;
  windowDuration: string;
  search: string;
}

type SortField = 'window_start' | 'total_checks' | 'most_active_count' | 'unique_expiditors' | 'analysis_date';
type SortDirection = 'asc' | 'desc';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalytics, setSelectedAnalytics] = useState<AnalyticsData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showTableMap, setShowTableMap] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<SortField>('window_start');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    expiditor: '',
    minChecks: '',
    maxChecks: '',
    radius: '',
    windowDuration: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.expiditor) params.append('expiditor', filters.expiditor);
      if (filters.minChecks) params.append('min_checks', filters.minChecks);
      if (filters.maxChecks) params.append('max_checks', filters.maxChecks);
      if (filters.radius) params.append('radius_meters', filters.radius);
      if (filters.windowDuration) params.append('window_duration_minutes', filters.windowDuration);
      if (filters.search) params.append('search', filters.search);
      
      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('page_size', pageSize.toString());
      
      // Add sorting parameters
      params.append('ordering', sortDirection === 'desc' ? `-${sortField}` : sortField);

      const response = await fetch(`/api/analytics/?${params.toString()}`);
      const data = await response.json();
      setAnalyticsData(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalRecords(data.count || 0);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters, currentPage, pageSize, sortField, sortDirection]);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      expiditor: '',
      minChecks: '',
      maxChecks: '',
      radius: '',
      windowDuration: '',
      search: ''
    });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Check pattern analysis - Time windows and geographic clusters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={fetchAnalyticsData} variant="outline" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/">
            <Button variant="outline" title="Home">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date From</label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date To</label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Expiditor Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Expiditor</label>
                <Input
                  placeholder="Search expiditor..."
                  value={filters.expiditor}
                  onChange={(e) => handleFilterChange('expiditor', e.target.value)}
                />
              </div>

              {/* Min Checks */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min Checks</label>
                <Input
                  type="number"
                  placeholder="Minimum checks"
                  value={filters.minChecks}
                  onChange={(e) => handleFilterChange('minChecks', e.target.value)}
                />
              </div>

              {/* Max Checks */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Checks</label>
                <Input
                  type="number"
                  placeholder="Maximum checks"
                  value={filters.maxChecks}
                  onChange={(e) => handleFilterChange('maxChecks', e.target.value)}
                />
              </div>

              {/* Radius */}
              <div>
                <label className="text-sm font-medium mb-2 block">Radius (meters)</label>
                <Select value={filters.radius} onValueChange={(value) => handleFilterChange('radius', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10m</SelectItem>
                    <SelectItem value="15">15m</SelectItem>
                    <SelectItem value="20">20m</SelectItem>
                    <SelectItem value="25">25m</SelectItem>
                    <SelectItem value="30">30m</SelectItem>
                    <SelectItem value="50">50m</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Window Duration */}
              <div>
                <label className="text-sm font-medium mb-2 block">Window Duration (min)</label>
                <Select value={filters.windowDuration} onValueChange={(value) => handleFilterChange('windowDuration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 min</SelectItem>
                    <SelectItem value="10">10 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="20">20 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
              <Button onClick={fetchAnalyticsData}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{analyticsData.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold">
                  {analyticsData.reduce((sum, item) => sum + item.total_checks, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Expiditors</p>
                <p className="text-2xl font-bold">
                  {new Set(analyticsData.map(item => item.most_active_expiditor)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Checks/Window</p>
                <p className="text-2xl font-bold">
                  {analyticsData.length > 0 
                    ? (analyticsData.reduce((sum, item) => sum + item.total_checks, 0) / analyticsData.length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analytics Data</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Pagination Controls - Top */}
          {analyticsData.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">
                      {/* Map column removed */}
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('window_start')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Date & Time
                        {getSortIcon('window_start')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Time Window</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Most Active Expiditor</th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('most_active_count')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Checks
                        {getSortIcon('most_active_count')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('total_checks')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Total Checks
                        {getSortIcon('total_checks')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button 
                        onClick={() => handleSort('unique_expiditors')}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        Unique Expiditors
                        {getSortIcon('unique_expiditors')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">Area</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {/* Map column removed */}
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{formatDate(item.window_start)}</div>
                          <div className="text-sm text-gray-600">{item.time_window_display}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {item.window_duration_minutes} min
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Lat: {item.center_lat.toFixed(4)}</div>
                          <div>Lon: {item.center_lon.toFixed(4)}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-blue-600">
                            {item.most_active_expiditor}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.most_active_count} checks
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {item.most_active_count}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {item.total_checks}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {item.unique_expiditors}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          {item.area_display}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAnalytics(item);
                            setShowMap(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {analyticsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No analytics data found with the current filters.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Map Section */}
      {showTableMap && analyticsData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Analytics Locations Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <YandexMap
              locations={analyticsData.map(item => ({
                id: item.id,
                lat: item.center_lat,
                lng: item.center_lon,
                expeditor: item.most_active_expiditor,
                time: item.window_start,
                status: `Total: ${item.total_checks} checks`
              }))}
              height="400px"
            />
          </CardContent>
        </Card>
      )}

      {/* Map Modal */}
      {showMap && selectedAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Check Locations - {selectedAnalytics.time_window_display}
              </h3>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMap(false);
                  setSelectedAnalytics(null);
                }}
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Analytics Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><strong>Time Window:</strong> {selectedAnalytics.time_window_display}</div>
                    <div><strong>Total Checks:</strong> {selectedAnalytics.total_checks}</div>
                    <div><strong>Most Active:</strong> {selectedAnalytics.most_active_expiditor}</div>
                    <div><strong>Radius:</strong> {selectedAnalytics.radius_meters}m</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Check List</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedAnalytics.check_locations.map((check) => (
                        <div key={check.id} className="text-sm border-b pb-2">
                          <div><strong>Check ID:</strong> {check.check_id}</div>
                          <div><strong>Client Name:</strong> {check.client_name}</div>
                          <div><strong>Time:</strong> {new Date(check.time).toLocaleString()}</div>
                          <div><strong>Expeditor:</strong> {check.expeditor}</div>
                          <div><strong>Location:</strong> {check.lat.toFixed(4)}, {check.lng.toFixed(4)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Yandex Map */}
              <Card className="h-96">
                <CardContent className="p-0 h-full">
                  <YandexMap
                    locations={selectedAnalytics.check_locations.map(check => ({
                      id: check.id,
                      lat: check.lat,
                      lng: check.lng,
                      expeditor: check.expeditor,
                      time: check.time,
                      status: check.status
                    }))}
                    height="100%"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          size="icon"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
