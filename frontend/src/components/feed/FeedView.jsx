import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import ReportCard from '../reports/ReportCard';
import SocialPostCard from './SocialPostCard';

const FeedView = () => {
  const { reports, socialPosts } = useApp();
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-900">
      <div className="flex border-b border-gray-700 bg-gray-800 shadow-lg">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-4 px-6 font-semibold transition ${
            activeTab === 'reports'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
          }`}
        >
          📍 Citizen Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-4 px-6 font-semibold transition ${
            activeTab === 'social'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-750'
          }`}
        >
          💬 Social Media ({socialPosts.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'reports' ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No reports available</div>
            ) : (
              reports.map((report) => <ReportCard key={report.report_id} report={report} />)
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {socialPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No social posts available</div>
            ) : (
              socialPosts.map((post) => <SocialPostCard key={post.post_id} post={post} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedView;