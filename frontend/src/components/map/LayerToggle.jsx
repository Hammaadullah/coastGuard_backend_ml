import React from 'react';
import { useApp } from '../../context/AppContext';

const LayerToggle = () => {
  const { mapLayers, setMapLayers } = useApp();

  const toggleLayer = (layer) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="space-y-2">
      {Object.keys(mapLayers).map((layer) => (
        <label
          key={layer}
          className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white transition"
        >
          <input
            type="checkbox"
            checked={mapLayers[layer]}
            onChange={() => toggleLayer(layer)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="capitalize text-sm">
            {layer.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        </label>
      ))}
    </div>
  );
};

export default LayerToggle;