import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const AnalyticsView = () => {
  const { reports, socialPosts } = useApp();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedHazardType, setSelectedHazardType] = useState('all');

  const hazardTypes = [
    { id: 'all', name: 'All Types' },
    { id: 1, name: 'Tsunami' },
    { id: 2, name: 'High Wave' },
    { id: 3, name: 'Oil Spill' },
    { id: 4, name: 'Flooding' },
  ];

  const filteredReports = reports.filter((r) => {
    if (selectedHazardType !== 'all' && r.type_id !== selectedHazardType) return false;
    if (dateRange.start && new Date(r.report_time) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(r.report_time) > new Date(dateRange.end)) return false;
    return true;
  });

  const statusCounts = {
    notVerified: filteredReports.filter((r) => r.status_id === 1).length,
    officialVerified: filteredReports.filter((r) => r.status_id === 2).length,
    communityVerified: filteredReports.filter((r) => r.status_id === 3).length,
    debunked: filteredReports.filter((r) => r.status_id === 4).length,
  };

  const hazardTypeCounts = [
    { name: 'Tsunami', count: filteredReports.filter((r) => r.type_id === 1).length },
    { name: 'High Wave', count: filteredReports.filter((r) => r.type_id === 2).length },
    { name: 'Oil Spill', count: filteredReports.filter((r) => r.type_id === 3).length },
    { name: 'Flooding', count: filteredReports.filter((r) => r.type_id === 4).length },
  ];

  const exportCSV = () => {
    const csvContent = [
      ['Report ID', 'Type', 'Status', 'Description', 'Location', 'Time'],
      ...filteredReports.map((r) => [
        r.report_id,
        r.type_name,
        r.status_name,
        r.description || '',
        r.location_name || '',
        r.report_time,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coastguard-reports-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white">📊 Analytics Dashboard</h2>
          <p className="text-gray-400 mt-2">Comprehensive data analysis and insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium text-sm">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium text-sm">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium text-sm">Hazard Type</label>
            <select
              value={selectedHazardType}
              onChange={(e) =>
                setSelectedHazardType(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {hazardTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-blue-100 text-sm mb-2 font-medium">Total Reports</h3>
            <p className="text-4xl font-bold text-white">{filteredReports.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-green-100 text-sm mb-2 font-medium">Verified</h3>
            <p className="text-4xl font-bold text-white">{statusCounts.officialVerified}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-yellow-100 text-sm mb-2 font-medium">Pending</h3>
            <p className="text-4xl font-bold text-white">{statusCounts.notVerified}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-purple-100 text-sm mb-2 font-medium">Social Posts</h3>
            <p className="text-4xl font-bold text-white">{socialPosts.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Reports by Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Not Verified</span>
                <span className="text-red-400 font-semibold">{statusCounts.notVerified}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Official Verified</span>
                <span className="text-green-400 font-semibold">
                  {statusCounts.officialVerified}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Community Verified</span>
                <span className="text-blue-400 font-semibold">
                  {statusCounts.communityVerified}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Debunked</span>
                <span className="text-orange-400 font-semibold">{statusCounts.debunked}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🌊</span>
              Reports by Hazard Type
            </h3>
            <div className="space-y-3">
              {hazardTypeCounts.map((type) => (
                <div
                  key={type.name}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-300">{type.name}</span>
                  <span className="text-blue-400 font-semibold">{type.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <span className="mr-2">💾</span>
              Export Data
            </h3>
            <button
              onClick={exportCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Download CSV
            </button>
          </div>
          <p className="text-gray-400">
            Export filtered report data for external analysis and research
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;