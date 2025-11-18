import React from 'react';
import { SENTIMENT_COLORS } from '../../utils/constants';

const SocialPostCard = ({ post }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white">{post.author_name}</h3>
          <p className="text-sm text-gray-400">
            {post.platform} • {new Date(post.post_time).toLocaleString()}
          </p>
        </div>
        {post.sentiment && (
          <span className={`text-sm font-semibold ${SENTIMENT_COLORS[post.sentiment]}`}>
            {post.sentiment}
          </span>
        )}
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed">{post.content}</p>

      {post.media_url && (
        <img
          src={post.media_url}
          alt="Post media"
          className="w-full h-64 object-cover rounded-lg mb-4 shadow-md"
        />
      )}

      <div className="flex items-center justify-between text-sm text-gray-400">
        {post.location_name && (
          <span className="flex items-center">
            <span className="mr-1">📍</span>
            {post.location_name}
          </span>
        )}
        {post.relevance_score && <span>Relevance: {post.relevance_score}%</span>}
      </div>
    </div>
  );
};

export default SocialPostCard;