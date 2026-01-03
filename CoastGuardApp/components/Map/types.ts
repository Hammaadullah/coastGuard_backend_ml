export interface MapMarker {
    id: string | number;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    pinColor?: string;
    onPress?: () => void;
}

export interface MapCircle {
    id: string | number;
    latitude: number;
    longitude: number;
    radius: number; // in meters
    fillColor: string;
    strokeColor: string;
}

export interface CoastMapProps {
    latitude: number;
    longitude: number;
    markers?: MapMarker[];
    circles?: MapCircle[];
    className?: string; // For NativeWind
}
