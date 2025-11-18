import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useApp } from '../../context/AppContext';
import { createCustomIcon } from '../../utils/mapIcons';
import { STATUS_COLORS } from '../../utils/constants';
import LayerToggle from './LayerToggle';

const MapView = () => {
  const { reports, hotspots, socialPosts, mapLayers, setSelectedReport, setSelectedPost } = useApp();
  const [center] = useState([12.9716, 77.5946]); // Default to Bangalore

  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-10 bg-gray-800 p-4 rounded-lg shadow-2xl border border-gray-700">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <span className="mr-2">🗂️</span>
          Map Layers
        </h3>
        <LayerToggle />
      </div>

      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {mapLayers.hotspots &&
          hotspots.map((hotspot) => (
            <Circle
              key={hotspot.hotspot_id}
              center={[hotspot.location.coordinates[1], hotspot.location.coordinates[0]]}
              radius={hotspot.radius_km * 1000}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-red-600">⚠️ Hotspot</p>
                  <p>Intensity: {hotspot.intensity_score}</p>
                  <p>Radius: {hotspot.radius_km} km</p>
                </div>
              </Popup>
            </Circle>
          ))}

        {mapLayers.reports &&
          reports.map((report) => {
            if (!report.location?.coordinates) return null;
            return (
              <Marker
                key={report.report_id}
                position={[report.location.coordinates[1], report.location.coordinates[0]]}
                icon={createCustomIcon(STATUS_COLORS[report.status_id] || '#gray')}
                eventHandlers={{
                  click: () => setSelectedReport(report),
                }}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <p className="font-semibold">{report.type_name || 'Report'}</p>
                    <p className="text-xs text-gray-600">{report.status_name}</p>
                    <p className="mt-1">{report.description || 'No description'}</p>
                    {report.media_urls && report.media_urls.length > 0 && (
                      <img src={report.media_urls[0]} alt="Report" className="mt-2 rounded w-full" />
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {mapLayers.socialPosts &&
          socialPosts.map((post) => {
            if (!post.latitude || !post.longitude) return null;
            return (
              <Marker
                key={post.post_id}
                position={[post.latitude, post.longitude]}
                icon={createCustomIcon('#8b5cf6')}
                eventHandlers={{
                  click: () => setSelectedPost(post),
                }}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <p className="font-semibold">{post.author_name}</p>
                    <p className="text-xs text-gray-600">{post.platform}</p>
                    <p className="mt-1">{post.content}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default MapView;