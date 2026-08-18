import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SmartRunningMap from '../components/SmartRunningMap';
import StrideLoader from '../components/ui/StrideLoader';
import api from '../services/api';
import type { SmartMapResponse, SmartRunningSpot } from '../types';
import { 
    Compass, 
    MapPin, 
    Navigation, 
    Car, 
    Sun, 
    Gauge, 
    RefreshCw, 
    ExternalLink, 
    Check, 
    AlertTriangle, 
    Sparkles, 
    ShieldAlert
} from 'lucide-react';

const SmartMap: React.FC = () => {
    const [data, setData] = useState<SmartMapResponse | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<SmartRunningSpot | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>('ALL');

    const fetchSmartMapData = (lat: number, lon: number, isRefresh: boolean = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        api.get(`/map/running-spots?lat=${lat}&lon=${lon}`)
            .then((res) => {
                setData(res.data);
                if (res.data.bestPlace) {
                    setSelectedSpot(res.data.bestPlace);
                } else if (res.data.nearbySpots?.length > 0) {
                    setSelectedSpot(res.data.nearbySpots[0]);
                }
            })
            .catch((err) => {
                console.error('Failed to load smart map data', err);
                setError('Unable to load smart map telemetry. Please check location permissions.');
            })
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    };

    const detectLocationAndFetch = (isRefresh: boolean = false) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchSmartMapData(pos.coords.latitude, pos.coords.longitude, isRefresh);
                },
                () => {
                    // Fallback to default coordinates
                    fetchSmartMapData(37.7749, -122.4194, isRefresh);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            fetchSmartMapData(37.7749, -122.4194, isRefresh);
        }
    };

    useEffect(() => {
        detectLocationAndFetch();
    }, []);

    const filteredSpots = (data?.nearbySpots || []).filter((spot) => {
        if (filterType === 'ALL') return true;
        if (filterType === 'PARKS') return spot.type.toLowerCase().includes('park');
        if (filterType === 'TRACKS') return spot.type.toLowerCase().includes('track');
        if (filterType === 'TRAILS') return spot.type.toLowerCase().includes('trail') || spot.type.toLowerCase().includes('station') || spot.type.toLowerCase().includes('recreation');
        return true;
    });

    const getSuitabilityColor = (tier: string) => {
        switch (tier) {
            case 'RECOMMENDED': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
            case 'MODERATE': return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
            case 'AVOID':
            default: return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
        }
    };

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Header Banner */}
                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_0_20px_var(--glow-purple)]">
                            <Compass className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                                    Smart Running Map
                                </h1>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                                    Traffic & AQI Aware
                                </span>
                            </div>
                            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">
                                Live GPS exploration of parks, tracks, and pedestrian routes evaluated with atmospheric & vehicle traffic conditions.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => detectLocationAndFetch(true)}
                        disabled={refreshing || loading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[var(--text)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Refreshing Telemetry...' : 'Refresh Location'}</span>
                    </button>
                </div>

                {loading && !data ? (
                    <div className="p-16 glass-card rounded-3xl border border-white/10">
                        <StrideLoader size="lg" text="Querying nearby running spots & traffic telemetry..." />
                    </div>
                ) : error || !data ? (
                    <div className="p-8 rounded-3xl glass-card border border-rose-500/30 text-center space-y-4">
                        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                        <p className="text-sm text-rose-300">{error || 'Unable to load smart map.'}</p>
                        <button
                            onClick={() => detectLocationAndFetch(false)}
                            className="px-5 py-2.5 rounded-xl auth-submit-btn text-xs font-bold"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Section 1: Best Place to Run Hero Card */}
                        {data.bestPlace && (
                            <div className="p-6 sm:p-8 rounded-3xl glass-card border border-[var(--accent)]/30 relative overflow-hidden bg-gradient-to-r from-[var(--accent)]/10 via-transparent to-emerald-500/10">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center space-x-2.5">
                                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>BEST PLACE TO RUN RIGHT NOW</span>
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {data.bestPlace.distanceKm.toFixed(1)} km away
                                            </span>
                                        </div>

                                        <h2 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                                            {data.bestPlace.name}
                                        </h2>

                                        {/* Highlights list */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {data.bestPlace.highlights.map((h, i) => (
                                                <span 
                                                    key={i} 
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--text)]"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>{h}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons & Score */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Suitability</span>
                                            <span className="text-2xl sm:text-3xl font-black text-[var(--accent)]">
                                                {Math.round(data.bestPlace.suitabilityScore)}/100
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setSelectedSpot(data.bestPlace!)}
                                                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[var(--text)] transition-all flex items-center justify-center space-x-2"
                                            >
                                                <MapPin className="w-4 h-4 text-[var(--accent)]" />
                                                <span>View on Map</span>
                                            </button>

                                            <a
                                                href={data.bestPlace.routeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-3 rounded-xl auth-submit-btn text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                <span>Get Route Directions</span>
                                                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Interactive Smart Map & Side Detail Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Map View (7 Cols on Desktop) */}
                            <div className="lg:col-span-7 h-[420px] sm:h-[550px] w-full">
                                <SmartRunningMap
                                    userLocation={data.userLocation}
                                    spots={filteredSpots}
                                    selectedSpot={selectedSpot}
                                    onSelectSpot={(spot) => setSelectedSpot(spot)}
                                />
                            </div>

                            {/* Detail Panel & Spots List (5 Cols on Desktop) */}
                            <div className="lg:col-span-5 space-y-4">
                                {/* Selected Spot Detail Card */}
                                {selectedSpot && (
                                    <div className="p-6 rounded-3xl glass-card border border-[var(--accent)]/40 space-y-4 shadow-xl animate-in fade-in">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getSuitabilityColor(selectedSpot.suitabilityTier)}`}>
                                                        {selectedSpot.suitabilityTier}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)] font-medium">
                                                        {selectedSpot.distanceKm.toFixed(2)} km away
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-[var(--text)] tracking-tight">
                                                    {selectedSpot.name}
                                                </h3>
                                                <p className="text-xs text-[var(--text-muted)]">{selectedSpot.type}</p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Running Score</span>
                                                <span className="text-xl font-black text-[var(--accent)]">
                                                    {Math.round(selectedSpot.suitabilityScore)}/100
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Telemetry Chips */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                <span className="text-[10px] text-[var(--text-muted)] block flex items-center justify-center gap-1">
                                                    <Car className="w-3 h-3 text-emerald-400" /> Traffic
                                                </span>
                                                <span className="font-bold text-[var(--text)]">
                                                    {selectedSpot.trafficInfo?.congestionLevel || 'LOW'}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                <span className="text-[10px] text-[var(--text-muted)] block flex items-center justify-center gap-1">
                                                    <Gauge className="w-3 h-3 text-cyan-400" /> AQI
                                                </span>
                                                <span className="font-bold text-[var(--text)]">
                                                    {data.airQuality?.aqi != null ? `${Math.round(data.airQuality.aqi)}` : '--'}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                                <span className="text-[10px] text-[var(--text-muted)] block flex items-center justify-center gap-1">
                                                    <Sun className="w-3 h-3 text-amber-400" /> Temp
                                                </span>
                                                <span className="font-bold text-[var(--text)]">
                                                    {data.weather?.temperatureC != null ? `${Math.round(data.weather.temperatureC)}°C` : '--'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Highlights & Cautions */}
                                        <div className="space-y-2 pt-1 border-t border-white/10 text-xs">
                                            {selectedSpot.highlights.map((h, i) => (
                                                <div key={i} className="flex items-center space-x-2 text-emerald-400">
                                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{h}</span>
                                                </div>
                                            ))}
                                            {selectedSpot.cautions.map((c, i) => (
                                                <div key={i} className="flex items-center space-x-2 text-amber-300">
                                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{c}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action: Route Navigation */}
                                        <div className="pt-2">
                                            <a
                                                href={selectedSpot.routeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-2.5 rounded-xl auth-submit-btn text-xs font-bold transition-all flex items-center justify-center space-x-2"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                <span>Open Route in Google Maps</span>
                                                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Spot Type Filters */}
                                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                                    {['ALL', 'PARKS', 'TRACKS', 'TRAILS'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilterType(f)}
                                            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                                                filterType === f
                                                    ? 'bg-[var(--accent)] text-white shadow-md'
                                                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-muted)]'
                                            }`}
                                        >
                                            {f === 'ALL' ? 'All Spots' : f === 'PARKS' ? 'City Parks' : f === 'TRACKS' ? 'Running Tracks' : 'Trails & Recreation'}
                                        </button>
                                    ))}
                                </div>

                                {/* Nearby Running Spots List */}
                                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                                    {filteredSpots.map((spot, idx) => (
                                        <div
                                            key={spot.osmId || idx}
                                            onClick={() => setSelectedSpot(spot)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                selectedSpot?.name === spot.name
                                                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] shadow-md'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-bold text-xs sm:text-sm text-[var(--text)] truncate">
                                                        {spot.name}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[var(--text-muted)]">
                                                    {spot.type} • {spot.distanceKm.toFixed(1)} km away
                                                </p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSuitabilityColor(spot.suitabilityTier)}`}>
                                                    {Math.round(spot.suitabilityScore)} pts
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Safety & Recommendation Disclaimer */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-[var(--text-muted)] flex items-start space-x-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                                Running suitability recommendations are calculated dynamically based on atmospheric air quality, weather conditions, proximity, and estimated surrounding vehicle traffic. This is a fitness recommendation system and does not constitute a guarantee of physical safety.
                            </span>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default SmartMap;
