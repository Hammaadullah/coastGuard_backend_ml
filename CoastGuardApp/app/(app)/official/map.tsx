import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { fetchHotspots, fetchReports, verifyReport, debunkReport, Report } from '../../../services/mapServices';

const MAPBOX_TOKEN = "pk.eyJ1IjoibmFyZW5kcmE1MDAiLCJhIjoiY21qeTBxa3ZwMDIxMjNjc2VwY3plaHV5diJ9.erZlLP54bgS1Z9gjcRlK1w";
export default function OfficialDashboard() {
    const queryClient = useQueryClient();
    const [location, setLocation] = useState({ latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // 1. Get Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);

    // 2. Poll Data (Hotspots & Reports) every 60s 
    const { data: hotspots } = useQuery({
        queryKey: ['hotspots'],
        queryFn: fetchHotspots,
        refetchInterval: 60000,
    });

    const { data: reports } = useQuery({
        queryKey: ['reports', location.latitude, location.longitude],
        queryFn: () => fetchReports(location.latitude, location.longitude, 20),
        refetchInterval: 60000,
    });

    // 3. Mutations for Actions 
    const verifyMutation = useMutation({
        mutationFn: verifyReport,
        onSuccess: () => {
            Alert.alert("Success", "Report verified successfully.");
            setSelectedReport(null);
            queryClient.invalidateQueries({ queryKey: ['reports'] }); // Refresh map
        },
        onError: () => Alert.alert("Error", "Failed to verify report.")
    });

    const debunkMutation = useMutation({
        mutationFn: debunkReport,
        onSuccess: () => {
            Alert.alert("Success", "Report marked as fake.");
            setSelectedReport(null);
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
        onError: () => Alert.alert("Error", "Failed to debunk report.")
    });

    const getPinColor = (status: string) => {
        // Red=New/Unverified, Green=Official Verified 
        if (status === 'official_verified') return 'green';
        if (status === 'fake') return 'black';
        return 'red';
    };

    return (
        <View className="flex-1 bg-gray-900">
            <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    zoom: 11,
                }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                style={{ width: '100%', height: '100%' }}
            >
                {/* Hotspots as circles */}
                {hotspots && (
                    <Source
                        id="hotspots"
                        type="geojson"
                        data={{
                            type: 'FeatureCollection',
                            features: hotspots.map((h) => ({
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [
                                        h.location.coordinates[0], // lon
                                        h.location.coordinates[1], // lat
                                    ],
                                },
                                properties: {
                                    radius: h.radius_km * 1000,
                                },
                            })),
                        }}
                    >
                        <Layer
                            id="hotspot-circles"
                            type="circle"
                            paint={{
                                'circle-radius': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    10, ['/', ['get', 'radius'], 200],
                                    14, ['/', ['get', 'radius'], 50],
                                ],
                                'circle-color': 'rgba(239,68,68,0.5)',
                                'circle-stroke-color': 'rgba(239,68,68,0.9)',
                                'circle-stroke-width': 2,
                            }}
                        />
                    </Source>
                )}

                {/* Reports as markers */}
                {reports?.map((r) => (
                    <Marker
                        key={`report-${r.report_id}`}
                        longitude={r.location.coordinates[0]}
                        latitude={r.location.coordinates[1]}
                        anchor="bottom"
                        onClick={() => setSelectedReport(r)}
                    >
                        <div
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor:
                                    r.status_name === 'official_verified'
                                        ? 'green'
                                        : r.status_name === 'fake'
                                            ? 'black'
                                            : 'red',
                                border: '2px solid white',
                                cursor: 'pointer',
                            }}
                        />
                    </Marker>
                ))}
            </Map>

            {/* Header / Logout */}
            <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
                <View className="bg-gray-800/80 p-2 rounded-lg">
                    <Text className="text-white font-bold">OFFICIAL MODE</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/citizen/profile')} className="bg-gray-800 p-3 rounded-full">
                    <Ionicons name="person" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Triage Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedReport}
                onRequestClose={() => setSelectedReport(null)}
            >
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity className="absolute inset-0 bg-black/50" onPress={() => setSelectedReport(null)} />

                    <View className="bg-gray-800 rounded-t-3xl p-6 h-[50%]">
                        <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-6" />

                        {selectedReport && (
                            <>
                                <View className="flex-row justify-between items-start mb-4">
                                    <View>
                                        <Text className="text-gray-400 text-xs uppercase tracking-widest mb-1">Incident Report</Text>
                                        <Text className="text-2xl font-bold text-white capitalize">{selectedReport.type_name || `Type ${selectedReport.type_id}`}</Text>
                                    </View>
                                    {/* AI Relevance Score */}
                                    <View className="bg-blue-900/50 px-3 py-1 rounded-full border border-blue-500">
                                        <Text className="text-blue-400 font-bold">AI Score: 8.5/10</Text>
                                    </View>
                                </View>

                                <Text className="text-gray-300 mb-6 leading-6">
                                    {/* Description is not in the list endpoint, assuming it might be fetched or passed */}
                                    Report ID: {selectedReport.report_id} {"\n"}
                                    Status: {selectedReport.status_name}
                                </Text>

                                {/* Action Buttons */}
                                <View className="flex-row gap-4 mt-auto mb-4">
                                    <TouchableOpacity
                                        onPress={() => debunkMutation.mutate(selectedReport.report_id)}
                                        disabled={debunkMutation.isPending}
                                        className="flex-1 bg-gray-700 py-4 rounded-xl items-center border border-gray-600"
                                    >
                                        {debunkMutation.isPending ? <ActivityIndicator color="white" /> : (
                                            <Text className="text-gray-300 font-bold">DEBUNK REPORT</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => verifyMutation.mutate(selectedReport.report_id)}
                                        disabled={verifyMutation.isPending}
                                        className="flex-1 bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-900/50"
                                    >
                                        {verifyMutation.isPending ? <ActivityIndicator color="white" /> : (
                                            <Text className="text-white font-bold">VERIFY REPORT</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Dark Map Style (Condensed)
const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];
