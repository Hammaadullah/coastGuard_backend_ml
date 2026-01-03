import React from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { View } from 'react-native';
import { CoastMapProps } from './types';
import { Ionicons } from '@expo/vector-icons';

const MAPBOX_TOKEN = "pk.eyJ1IjoibmFyZW5kcmE1MDAiLCJhIjoiY21qeTBxa3ZwMDIxMjNjc2VwY3plaHV5diJ9.erZlLP54bgS1Z9gjcRlK1w";

export default function CoastMap({ latitude, longitude, markers, circles, className }: CoastMapProps) {
    return (
        <View className={className || "h-full w-full"}>
            <Map
                initialViewState={{
                    longitude: longitude,
                    latitude: latitude,
                    zoom: 12
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11" // Dark mode as per design requirements
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {/* Render Circles using GeoJSON Layers (More efficient for WebGL) */}
                {circles?.map((c) => (
                    <Source
                        key={`source-${c.id}`}
                        type="geojson"
                        data={{
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
                            properties: {}
                        }}
                    >
                        <Layer
                            id={`circle-${c.id}`}
                            type="circle"
                            paint={{
                                'circle-radius': {
                                    stops: [[0, 0], [20, c.radius / 5]] // Approximate meter scaling logic needed for precise radius
                                },
                                'circle-color': c.fillColor,
                                'circle-stroke-color': c.strokeColor,
                                'circle-stroke-width': 2,
                            }}
                        />
                    </Source>
                ))}

                {/* Render Markers */}
                {markers?.map((m) => (
                    <Marker
                        key={m.id}
                        longitude={m.longitude}
                        latitude={m.latitude}
                        anchor="bottom"
                        onClick={m.onPress}
                    >
                        {/* Using an Icon since web markers are DOM elements */}
                        <Ionicons name="location" size={30} color={m.pinColor || 'red'} />
                    </Marker>
                ))}
            </Map>
        </View>
    );
}
