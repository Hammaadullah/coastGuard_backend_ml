import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import CoastMap from '../../../components/Map/index.web';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { fetchHotspots, fetchReports } from '../../../services/mapServices';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
    const router = useRouter();
    const [location, setLocation] = useState({ latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    const [permissionGranted, setPermissionGranted] = useState(false);

    // 1. Get User Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            setPermissionGranted(true);

            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);

    const { data: hotspots } = useQuery({
        queryKey: ['hotspots'],
        queryFn: fetchHotspots,
        refetchInterval: 60000,
    });

    // 3. Fetch Reports (Poll every 60s)
    // Note: In a real app, update lat/lon params when map region changes
    const { data: reports } = useQuery({
        queryKey: ['reports', location.latitude, location.longitude],
        queryFn: () => fetchReports(location.latitude, location.longitude, 20), // 20km radius
        enabled: permissionGranted,
        refetchInterval: 60000,
    });

    // Helper to get color by hazard type
    const getHazardColor = (typeId: number) => {
        switch (typeId) {
            case 1: return 'rgba(239, 68, 68, 0.5)'; // Red (Tsunami)
            case 2: return 'rgba(59, 130, 246, 0.5)'; // Blue (High Waves)
            case 3: return 'rgba(16, 185, 129, 0.5)'; // Green (Oil Spill)
            default: return 'rgba(107, 114, 128, 0.5)'; // Gray
        }
    };

    const mapCircles = hotspots?.map(h => ({
        id: h.hotspot_id,
        latitude: h.location.coordinates[1],
        longitude: h.location.coordinates[0],
        radius: h.radius_km * 1000,
        fillColor: 'rgba(239, 68, 68, 0.5)',
        strokeColor: 'rgba(255, 255, 255, 0.5)',
    }));

    const mapMarkers = reports?.map(r => ({
        id: r.report_id,
        latitude: r.location.coordinates[1],
        longitude: r.location.coordinates[0],
        title: r.status_name,
        pinColor: r.status_name === 'official_verified' ? 'green' : 'red',
        onPress: () => console.log('Marker pressed', r.report_id) // Or handle navigation
    }));

    return (
        <View className="flex-1 bg-gray-900">
            {/* 3. Render Unified Map */}
            <CoastMap
                latitude={location.latitude}
                longitude={location.longitude}
                markers={mapMarkers}
                circles={mapCircles}
                className="w-full h-full"
            />

            {/* Floating Action Buttons remain overlayed on top */}
            <TouchableOpacity
                onPress={() => router.push('/(app)/citizen/report')}
                className="absolute bottom-10 right-6 bg-red-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View>
    );
}

// Simple Dark Style for Maps (Optional)
const darkMapStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
    },
    // ... (Can grab full dark mode JSON from snazzymaps.com)
];
