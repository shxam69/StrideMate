import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SmartRunningSpot, LocationInfo } from '../types';
import { Crosshair } from 'lucide-react';

interface SmartRunningMapProps {
    userLocation: LocationInfo;
    spots: SmartRunningSpot[];
    selectedSpot: SmartRunningSpot | null;
    onSelectSpot: (spot: SmartRunningSpot) => void;
}

const SmartRunningMap: React.FC<SmartRunningMapProps> = ({
    userLocation,
    spots,
    selectedSpot,
    onSelectSpot
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);

    // 1. Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Map
        const map = L.map(mapContainerRef.current, {
            center: [userLocation.latitude, userLocation.longitude],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
        });

        // CartoDB Dark Matter Tiles for premium dark aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);

        // Attribution
        L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap, CartoDB' }).addTo(map);

        // Create Markers Layer
        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 2. Update User Location Marker
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Custom Glowing User Marker
        const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
                <div style="position: relative; width: 24px; height: 24px;">
                    <div style="position: absolute; inset: -8px; background: rgba(99, 102, 241, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="position: relative; width: 24px; height: 24px; background: #6366f1; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 15px rgba(99, 102, 241, 0.9);"></div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            icon: userIcon,
            zIndexOffset: 1000
        }).addTo(map);

        userMarker.bindTooltip('<b>Your Current Location</b>', { direction: 'top', offset: [0, -12] });
        userMarkerRef.current = userMarker;
    }, [userLocation]);

    // 3. Render Running Spot Markers
    useEffect(() => {
        const markersLayer = markersLayerRef.current;
        if (!markersLayer) return;

        markersLayer.clearLayers();

        spots.forEach((spot) => {
            const isSelected = selectedSpot?.osmId === spot.osmId || (selectedSpot?.name === spot.name);
            
            let color = '#10b981'; // Emerald
            let bgGlow = 'rgba(16, 185, 129, 0.5)';
            if (spot.suitabilityTier === 'MODERATE') {
                color = '#f59e0b'; // Amber
                bgGlow = 'rgba(245, 158, 11, 0.5)';
            } else if (spot.suitabilityTier === 'AVOID') {
                color = '#f43f5e'; // Rose
                bgGlow = 'rgba(244, 63, 94, 0.5)';
            }

            const spotIcon = L.divIcon({
                className: 'custom-spot-marker',
                html: `
                    <div style="cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1.0)'}; transition: transform 0.2s ease;">
                        <div style="
                            background: ${color}; 
                            color: white; 
                            font-size: 11px; 
                            font-weight: 800; 
                            padding: 4px 8px; 
                            border-radius: 12px; 
                            border: 2px solid white; 
                            box-shadow: 0 4px 15px ${bgGlow};
                            display: flex; 
                            align-items: center; 
                            gap: 4px;
                            white-space: nowrap;
                        ">
                            <span>${Math.round(spot.suitabilityScore)}</span>
                            <span style="font-size: 8px; opacity: 0.85;">PTS</span>
                        </div>
                    </div>
                `,
                iconSize: [40, 24],
                iconAnchor: [20, 12]
            });

            const marker = L.marker([spot.latitude, spot.longitude], { icon: spotIcon });
            marker.on('click', () => {
                onSelectSpot(spot);
            });

            marker.bindTooltip(`<b>${spot.name}</b><br/>${spot.type} • ${spot.distanceKm.toFixed(1)} km`, {
                direction: 'top',
                offset: [0, -12]
            });

            markersLayer.addLayer(marker);
        });
    }, [spots, selectedSpot, onSelectSpot]);

    // 4. Pan to selected spot when updated
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !selectedSpot) return;

        map.flyTo([selectedSpot.latitude, selectedSpot.longitude], 15, {
            animate: true,
            duration: 1.0
        });
    }, [selectedSpot]);

    const handleCenterUser = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        map.flyTo([userLocation.latitude, userLocation.longitude], 14, {
            animate: true,
            duration: 0.8
        });
    };

    return (
        <div className="relative w-full h-full min-h-[380px] sm:min-h-[480px] rounded-3xl overflow-hidden border border-white/10 glass-card">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[480px] z-0" />

            {/* Floating Action Button: Recenter on User */}
            <button
                onClick={handleCenterUser}
                className="absolute bottom-4 right-4 z-[400] p-3 rounded-2xl bg-[var(--surface-elevated)]/90 backdrop-blur-md border border-white/15 text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 shadow-lg transition-all flex items-center space-x-1.5 text-xs font-bold"
                title="Recenter on My Location"
            >
                <Crosshair className="w-4 h-4 text-[var(--accent)]" />
                <span className="hidden sm:inline">My Location</span>
            </button>

            {/* Suitability Legend Chip */}
            <div className="absolute top-4 left-4 z-[400] px-3.5 py-2 rounded-2xl bg-[var(--surface-elevated)]/90 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-[var(--text)] shadow-lg flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Recommended</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>Moderate</span>
                </div>
                <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>Avoid</span>
                </div>
            </div>
        </div>
    );
};

export default SmartRunningMap;
