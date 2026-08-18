import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { SmartMapResponse } from '../types';
import { 
    MapPin, 
    ArrowRight, 
    Compass, 
    AlertTriangle,
    Car
} from 'lucide-react';

const SmartRunningWidget: React.FC = () => {
    const [data, setData] = useState<SmartMapResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchSmartMap(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    fetchSmartMap(37.7749, -122.4194);
                },
                { timeout: 8000 }
            );
        } else {
            fetchSmartMap(37.7749, -122.4194);
        }
    }, []);

    const fetchSmartMap = (lat: number, lon: number) => {
        api.get(`/map/running-spots?lat=${lat}&lon=${lon}`)
            .then((res) => setData(res.data))
            .catch((err) => {
                console.error('Failed to load smart running widget', err);
                setError('Smart map unavailable');
            })
            .finally(() => setLoading(false));
    };

    if (loading) {
        return (
            <div className="p-6 rounded-3xl glass-card border border-white/10 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10" />
                    <div className="space-y-2">
                        <div className="w-32 h-4 bg-white/10 rounded" />
                        <div className="w-48 h-3 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="w-24 h-8 bg-white/10 rounded-xl" />
            </div>
        );
    }

    if (error || !data) return null;

    const best = data.bestPlace;

    return (
        <div className="p-6 sm:p-7 rounded-3xl glass-card border border-white/10 relative overflow-hidden transition-all hover:border-[var(--accent)]/30 group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_0_12px_var(--glow-purple)]">
                        <Compass className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">SMART RUNNING MAP</h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                Real-time
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Traffic-aware outdoor route intelligence & nearby running spots
                        </p>
                    </div>
                </div>

                <Link
                    to="/map"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-[0_0_15px_var(--glow-purple)] hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
                >
                    <span>Open Smart Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Content Row: Best Place & Fast Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
                <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                        Top Recommended Running Venue
                    </span>
                    {best ? (
                        <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-extrabold text-sm sm:text-base text-[var(--text)] truncate">
                                    {best.name}
                                </h4>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {best.type} • {best.distanceKm.toFixed(1)} km away • {best.highlights[0] || 'Recommended route'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>No outdoor venue currently meets peak running criteria.</span>
                        </p>
                    )}
                </div>

                <div className="md:col-span-5 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[var(--text-muted)] block">Suitability</span>
                        <span className="text-sm font-black text-[var(--accent)]">
                            {data.overallRunningScore}/100
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[var(--text-muted)] block">Air Quality</span>
                        <span className={`text-sm font-black ${data.airQuality && data.airQuality.aqi <= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.airQuality?.aqi != null ? `${Math.round(data.airQuality.aqi)} AQI` : '--'}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-[var(--text-muted)] block">Traffic</span>
                        <span className="text-sm font-black text-emerald-400 flex items-center justify-center gap-0.5">
                            <Car className="w-3 h-3" />
                            <span>{data.traffic?.congestionLevel || 'LOW'}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartRunningWidget;
