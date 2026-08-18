import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { EnvironmentResponse } from '../types';
import { 
    CloudSun, 
    Wind, 
    Sun, 
    ArrowRight, 
    RefreshCw, 
    AlertTriangle, 
    Gauge,
    Sparkles 
} from 'lucide-react';

const EnvironmentCard: React.FC = () => {
    const [data, setData] = useState<EnvironmentResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEnvironment = (lat: number, lon: number) => {
        setLoading(true);
        setError(null);
        api.get(`/environment/current?lat=${lat}&lon=${lon}`)
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error('Failed to load environment data', err);
                setError('Unable to load outdoor conditions');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const detectLocationAndFetch = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchEnvironment(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    // Fallback to default coordinates (e.g. San Francisco)
                    fetchEnvironment(37.7749, -122.4194);
                },
                { timeout: 8000 }
            );
        } else {
            fetchEnvironment(37.7749, -122.4194);
        }
    };

    useEffect(() => {
        detectLocationAndFetch();
    }, []);

    const getConditionTheme = (condition?: string) => {
        switch (condition) {
            case 'EXCELLENT':
                return {
                    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
                    label: '🟢 EXCELLENT FOR RUNNING',
                };
            case 'GOOD':
                return {
                    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
                    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
                    label: '🟢 GOOD CONDITIONS',
                };
            case 'MODERATE':
                return {
                    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
                    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                    label: '🟡 MODERATE CONDITIONS',
                };
            case 'POOR':
                return {
                    badgeBg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
                    dot: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
                    label: '🟠 SUBOPTIMAL CONDITIONS',
                };
            case 'AVOID':
            default:
                return {
                    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse',
                    label: '🔴 OUTDOOR RUNNING NOT RECOMMENDED',
                };
        }
    };

    if (loading && !data) {
        return (
            <div className="p-6 rounded-3xl glass-card border border-white/10 flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10" />
                    <div className="space-y-2">
                        <div className="w-36 h-4 bg-white/10 rounded" />
                        <div className="w-24 h-3 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="w-24 h-8 bg-white/10 rounded-xl" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 rounded-3xl glass-card border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-white/60 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{error || 'Outdoor environmental data unavailable.'}</span>
                </div>
                <button
                    onClick={detectLocationAndFetch}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text)] transition-all flex items-center gap-1"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    const theme = getConditionTheme(data.condition);

    return (
        <div className="p-6 sm:p-7 rounded-3xl glass-card border border-white/10 relative overflow-hidden transition-all hover:border-white/20 group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_0_12px_var(--glow-purple)]">
                        <CloudSun className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">OUTDOOR CONDITIONS</h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] border border-white/5">
                                Live
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Real-time atmospheric telemetry for outdoor fitness
                        </p>
                    </div>
                </div>

                {/* Condition Pill */}
                <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl border text-xs font-bold ${theme.badgeBg}`}>
                        <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                        <span>{theme.label}</span>
                    </div>
                    <Link
                        to="/environment"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--accent)] hover:text-white transition-all group-hover:scale-105"
                        title="View Full Environment Details"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Temperature</span>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-base sm:text-lg font-extrabold text-[var(--text)]">
                        {data.weather.temperatureC != null ? `${Math.round(data.weather.temperatureC)}°C` : '--'}
                    </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Air Quality (AQI)</span>
                        <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-base sm:text-lg font-extrabold text-[var(--text)]">
                        {data.airQuality.aqi != null ? Math.round(data.airQuality.aqi) : '--'}
                        <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">AQI</span>
                    </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Wind Speed</span>
                        <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-base sm:text-lg font-extrabold text-[var(--text)]">
                        {data.weather.windSpeedKmh != null ? `${Math.round(data.weather.windSpeedKmh)}` : '--'}
                        <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">km/h</span>
                    </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>Running Score</span>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <p className="text-base sm:text-lg font-extrabold text-[var(--accent)]">
                        {data.runningScore}/100
                    </p>
                </div>
            </div>

            {/* Recommendation Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                <p className="text-[var(--text-muted)] flex-1 line-clamp-2">
                    {data.recommendation}
                </p>
                <Link
                    to="/environment"
                    className="inline-flex items-center space-x-1.5 font-bold text-[var(--accent)] hover:text-white transition-colors shrink-0"
                >
                    <span>View Environment & Nearby Spots</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
};

export default EnvironmentCard;
