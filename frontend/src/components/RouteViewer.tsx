import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoutePoint } from '../types';
import { 
    Play, 
    Pause, 
    RotateCcw, 
    Gauge, 
    Clock, 
    MapPin, 
    Activity as ActivityIcon 
} from 'lucide-react';

interface RouteViewerProps {
    points: RoutePoint[];
    sport?: string;
    totalDistanceKm?: number;
    totalDurationSeconds?: number;
}

const RouteViewer: React.FC<RouteViewerProps> = ({
    points,
    sport = 'WALKING',
    totalDurationSeconds
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const replayMarkerRef = useRef<L.Marker | null>(null);

    // Replay State
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
    const animationFrameRef = useRef<number | null>(null);
    const lastTickTimeRef = useRef<number>(0);

    const hasRoute = points && points.length >= 2;

    // 1. Initialize Map and Draw Polyline
    useEffect(() => {
        if (!mapContainerRef.current || !hasRoute) return;

        const firstPt = points[0];
        const map = L.map(mapContainerRef.current, {
            center: [firstPt.latitude, firstPt.longitude],
            zoom: 15,
            zoomControl: false,
            attributionControl: false
        });

        // Voyager / Dark Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map);

        L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap' }).addTo(map);

        const latLngs = points.map(p => [p.latitude, p.longitude] as [number, number]);

        // Draw Route Polyline
        const polyline = L.polyline(latLngs, {
            color: '#6366f1',
            weight: 4.5,
            opacity: 0.9,
            lineJoin: 'round',
            dashArray: undefined
        }).addTo(map);
        polylineRef.current = polyline;

        // Start Marker (Green)
        const startIcon = L.divIcon({
            className: 'custom-start-marker',
            html: `
                <div style="background: #10b981; color: white; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 8px; border: 2px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.7); display: flex; align-items: center; gap: 3px;">
                    <span>START</span>
                </div>
            `,
            iconSize: [46, 20],
            iconAnchor: [23, 10]
        });
        L.marker(latLngs[0], { icon: startIcon }).addTo(map);

        // Finish Marker (Rose / Checkered)
        const finishIcon = L.divIcon({
            className: 'custom-finish-marker',
            html: `
                <div style="background: #f43f5e; color: white; font-size: 10px; font-weight: 800; padding: 3px 6px; border-radius: 8px; border: 2px solid white; box-shadow: 0 0 10px rgba(244,63,94,0.7); display: flex; align-items: center; gap: 3px;">
                    <span>FINISH</span>
                </div>
            `,
            iconSize: [48, 20],
            iconAnchor: [24, 10]
        });
        L.marker(latLngs[latLngs.length - 1], { icon: finishIcon }).addTo(map);

        // Replay Active Marker (Blue beacon)
        const replayIcon = L.divIcon({
            className: 'custom-replay-marker',
            html: `
                <div style="position: relative; width: 22px; height: 22px;">
                    <div style="position: absolute; inset: -6px; background: rgba(99, 102, 241, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="position: relative; width: 22px; height: 22px; background: #6366f1; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px rgba(99, 102, 241, 0.9);"></div>
                </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        const replayMarker = L.marker(latLngs[0], { icon: replayIcon, zIndexOffset: 2000 }).addTo(map);
        replayMarkerRef.current = replayMarker;

        // Fit bounds with comfortable padding
        map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [points, hasRoute]);

    // 2. Route Replay Animation Engine
    useEffect(() => {
        if (!isPlaying || !hasRoute) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const intervalMs = Math.max(16, 200 / playbackSpeed);

        const animate = (now: number) => {
            if (now - lastTickTimeRef.current >= intervalMs) {
                lastTickTimeRef.current = now;
                setCurrentIndex(prev => {
                    if (prev >= points.length - 1) {
                        setIsPlaying(false);
                        return points.length - 1;
                    }
                    return prev + 1;
                });
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        lastTickTimeRef.current = performance.now();
        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, points, playbackSpeed, hasRoute]);

    // 3. Update Replay Marker Position
    useEffect(() => {
        if (!replayMarkerRef.current || !hasRoute || currentIndex >= points.length) return;
        const pt = points[currentIndex];
        replayMarkerRef.current.setLatLng([pt.latitude, pt.longitude]);
    }, [currentIndex, points, hasRoute]);

    if (!hasRoute) {
        return (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2 text-[var(--text-muted)]">
                <MapPin className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-semibold">GPS Route unavailable for this activity.</p>
                <p className="text-[11px] opacity-70">Route tracking is preserved during outdoor GPS workouts.</p>
            </div>
        );
    }

    const currentPt = points[currentIndex] || points[0];
    const currentSpeed = currentPt.speed != null && currentPt.speed > 0 ? (currentPt.speed * 3.6).toFixed(1) : '0.0';
    const progressPercent = Math.round((currentIndex / (points.length - 1)) * 100);

    const formatSeconds = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const s = sec % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    const simulatedElapsed = totalDurationSeconds 
        ? Math.round((currentIndex / (points.length - 1)) * totalDurationSeconds)
        : 0;

    return (
        <div className="space-y-4">
            {/* Map Container */}
            <div className="relative w-full h-[280px] sm:h-[360px] rounded-3xl overflow-hidden border border-white/10 glass-card">
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* HUD Telemetry Overlay during Replay */}
                <div className="absolute top-3 left-3 z-[400] px-3 py-1.5 rounded-2xl bg-[var(--surface-elevated)]/90 backdrop-blur-md border border-white/15 shadow-lg flex items-center space-x-3 text-xs font-bold text-[var(--text)]">
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>{formatSeconds(simulatedElapsed)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{currentSpeed} km/h</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <ActivityIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{sport}</span>
                    </div>
                </div>

                {/* Progress Pill */}
                <div className="absolute top-3 right-3 z-[400] px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-extrabold text-[var(--accent)]">
                    {progressPercent}%
                </div>
            </div>

            {/* Replay Controls & Timeline */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2.5 rounded-xl bg-[var(--accent)] text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_10px_var(--glow-purple)]"
                        title={isPlaying ? 'Pause Replay' : 'Play Replay'}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={() => {
                            setIsPlaying(false);
                            setCurrentIndex(0);
                        }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[var(--text)] transition-all"
                        title="Restart Route"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <div className="flex items-center bg-white/10 rounded-xl p-0.5 text-xs font-bold">
                        {[1, 2, 5].map((spd) => (
                            <button
                                key={spd}
                                onClick={() => setPlaybackSpeed(spd)}
                                className={`px-2 py-1 rounded-lg transition-all ${playbackSpeed === spd ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
                            >
                                {spd}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrubber Slider */}
                <div className="flex-1 w-full flex items-center space-x-3 px-2">
                    <input
                        type="range"
                        min="0"
                        max={points.length - 1}
                        value={currentIndex}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setCurrentIndex(parseInt(e.target.value, 10));
                        }}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                    />
                </div>
            </div>
        </div>
    );
};

export default RouteViewer;
