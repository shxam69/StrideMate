import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import type { EnvironmentResponse } from '../types';
import { 
    CloudSun, 
    Sun, 
    RefreshCw, 
    AlertTriangle, 
    Gauge, 
    MapPin, 
    ExternalLink
} from 'lucide-react';

const Environment: React.FC = () => {
    const [data, setData] = useState<EnvironmentResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEnvironmentData = (lat: number, lon: number, isRefresh: boolean = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        api.get(`/environment/current?lat=${lat}&lon=${lon}`)
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error('Failed to load environment data', err);
                setError('Failed to retrieve live atmospheric conditions. Please try again.');
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
                    fetchEnvironmentData(pos.coords.latitude, pos.coords.longitude, isRefresh);
                },
                () => {
                    // Fallback to default coordinates
                    fetchEnvironmentData(37.7749, -122.4194, isRefresh);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            fetchEnvironmentData(37.7749, -122.4194, isRefresh);
        }
    };

    useEffect(() => {
        detectLocationAndFetch();
    }, []);

    const getConditionBadge = (condition?: string) => {
        switch (condition) {
            case 'EXCELLENT':
                return {
                    label: 'EXCELLENT FOR RUNNING',
                    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    dot: 'bg-emerald-400',
                    desc: 'Air quality is pristine and temperatures are ideal for outdoor endurance workouts.'
                };
            case 'GOOD':
                return {
                    label: 'GOOD FOR RUNNING',
                    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    dot: 'bg-emerald-400',
                    desc: 'Great atmospheric conditions for outdoor training. Stay hydrated and enjoy your workout.'
                };
            case 'MODERATE':
                return {
                    label: 'MODERATE CONDITIONS',
                    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    dot: 'bg-amber-400',
                    desc: 'Acceptable conditions. Sensitive athletes should monitor exertion levels.'
                };
            case 'POOR':
                return {
                    label: 'SUBOPTIMAL CONDITIONS',
                    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
                    dot: 'bg-orange-400',
                    desc: 'Elevated pollutants or extreme temperatures. Consider indoor training.'
                };
            case 'AVOID':
            default:
                return {
                    label: 'OUTDOOR RUNNING NOT RECOMMENDED',
                    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    dot: 'bg-rose-500 animate-pulse',
                    desc: 'Severe air pollution or hazardous weather detected. Exercise indoors today.'
                };
        }
    };

    const getAqiColor = (aqi?: number) => {
        if (aqi == null) return 'text-white/60';
        if (aqi <= 20) return 'text-emerald-400';
        if (aqi <= 40) return 'text-lime-400';
        if (aqi <= 60) return 'text-amber-400';
        if (aqi <= 80) return 'text-orange-400';
        return 'text-rose-400';
    };

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_0_20px_var(--glow-purple)]">
                            <CloudSun className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                                    Environment Intelligence
                                </h1>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] border border-white/5">
                                    Open-Meteo
                                </span>
                            </div>
                            <p className="text-[var(--text-muted)] text-xs sm:text-sm mt-0.5">
                                Real-time atmospheric analysis, air pollution metrics, and running spot recommendations.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => detectLocationAndFetch(true)}
                        disabled={refreshing || loading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[var(--text)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Updating Telemetry...' : 'Refresh Location & Data'}</span>
                    </button>
                </div>

                {loading && !data ? (
                    <div className="p-12 text-center space-y-4 glass-card rounded-3xl border border-white/10">
                        <div className="w-10 h-10 border-3 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-semibold text-[var(--text)]">Analyzing atmospheric conditions & air quality...</p>
                    </div>
                ) : error || !data ? (
                    <div className="p-8 rounded-3xl glass-card border border-rose-500/30 text-center space-y-4">
                        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                        <p className="text-sm text-rose-300">{error || 'Unable to retrieve environment data.'}</p>
                        <button
                            onClick={() => detectLocationAndFetch(false)}
                            className="px-5 py-2.5 rounded-xl auth-submit-btn text-xs font-bold"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Section 1: Hero Running Condition Banner */}
                        {(() => {
                            const badge = getConditionBadge(data.condition);
                            return (
                                <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold shadow-lg ${badge.badge}`}>
                                                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                                                    <span>{badge.label}</span>
                                                </div>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Lat: {data.location.latitude.toFixed(3)}, Lon: {data.location.longitude.toFixed(3)}
                                                </span>
                                            </div>

                                            <p className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed">
                                                {data.recommendation}
                                            </p>
                                        </div>

                                        {/* Running Score Dial */}
                                        <div className="flex items-center space-x-4 bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl shrink-0 self-stretch sm:self-auto justify-center">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Running Score</span>
                                                <div className="text-3xl sm:text-4xl font-black text-[var(--accent)] mt-0.5">
                                                    {data.runningScore}
                                                    <span className="text-xs font-semibold text-[var(--text-muted)]">/100</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Section 2: Live Weather Telemetry */}
                        <div className="space-y-3">
                            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center space-x-2">
                                <Sun className="w-5 h-5 text-amber-400" />
                                <span>Weather Conditions</span>
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Temperature</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.weather.temperatureC != null ? `${Math.round(data.weather.temperatureC)}°C` : '--'}
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">
                                        Feels like {data.weather.feelsLikeC != null ? `${Math.round(data.weather.feelsLikeC)}°C` : '--'}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Humidity</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.weather.humidityPercent != null ? `${Math.round(data.weather.humidityPercent)}%` : '--'}
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">Relative moisture</span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Wind Speed</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.weather.windSpeedKmh != null ? `${Math.round(data.weather.windSpeedKmh)}` : '--'}
                                        <span className="text-xs font-normal text-[var(--text-muted)] ml-1">km/h</span>
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">
                                        {data.weather.windSpeedKmh && data.weather.windSpeedKmh > 30 ? 'Breezy/Gusty' : 'Gentle breeze'}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Precipitation</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.weather.precipitationMm != null ? `${data.weather.precipitationMm}` : '0.0'}
                                        <span className="text-xs font-normal text-[var(--text-muted)] ml-1">mm</span>
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">
                                        {data.weather.precipitationMm && data.weather.precipitationMm > 0 ? 'Rain present' : 'Dry ground'}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">UV Index</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.uvIndex != null ? Math.round(data.uvIndex) : '0'}
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">
                                        {data.uvIndex && data.uvIndex >= 6 ? 'High (wear sunscreen)' : 'Safe UV'}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <span className="text-xs text-[var(--text-muted)] block">Weather Code</span>
                                    <p className="text-lg sm:text-xl font-extrabold text-[var(--text)]">
                                        {data.weather.weatherCode === 0 ? 'Clear' : data.weather.weatherCode && data.weather.weatherCode < 4 ? 'Cloudy' : 'Overcast'}
                                    </p>
                                    <span className="text-[10px] text-[var(--text-muted)] block">Sky visibility</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Air Quality & Atmospheric Pollutants */}
                        <div className="space-y-3">
                            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center space-x-2">
                                <Gauge className="w-5 h-5 text-emerald-400" />
                                <span>Air Quality & Pollutants (µg/m³)</span>
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                        <span>European AQI</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Index</span>
                                    </div>
                                    <p className={`text-2xl font-black ${getAqiColor(data.airQuality.aqi)}`}>
                                        {data.airQuality.aqi != null ? Math.round(data.airQuality.aqi) : '--'}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {data.airQuality.aqi != null && data.airQuality.aqi <= 20 ? '🟢 Very Good' : data.airQuality.aqi != null && data.airQuality.aqi <= 40 ? '🟢 Good' : '🟡 Moderate/Poor'}
                                    </p>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                        <span>Fine Particles (PM2.5)</span>
                                        <span className="text-[10px] text-white/40">µg/m³</span>
                                    </div>
                                    <p className="text-2xl font-black text-[var(--text)]">
                                        {data.airQuality.pm25 != null ? Math.round(data.airQuality.pm25 * 10) / 10 : '--'}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {data.airQuality.pm25 != null && data.airQuality.pm25 <= 15 ? 'Safe for outdoor cardio' : 'Elevated particles'}
                                    </p>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                        <span>Coarse Dust (PM10)</span>
                                        <span className="text-[10px] text-white/40">µg/m³</span>
                                    </div>
                                    <p className="text-2xl font-black text-[var(--text)]">
                                        {data.airQuality.pm10 != null ? Math.round(data.airQuality.pm10 * 10) / 10 : '--'}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        {data.airQuality.pm10 != null && data.airQuality.pm10 <= 45 ? 'Clean respiration' : 'Noticeable dust'}
                                    </p>
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                        <span>Ozone (O₃)</span>
                                        <span className="text-[10px] text-white/40">µg/m³</span>
                                    </div>
                                    <p className="text-2xl font-black text-[var(--text)]">
                                        {data.airQuality.ozone != null ? Math.round(data.airQuality.ozone) : '--'}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)]">Ground-level oxidants</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Recommended Nearby Running Spots */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center space-x-2">
                                    <MapPin className="w-5 h-5 text-[var(--accent)]" />
                                    <span>Recommended Running Spots Nearby</span>
                                </h2>
                                <span className="text-xs text-[var(--text-muted)]">
                                    Ranked by environmental score + suitability + proximity
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.nearbySpots && data.nearbySpots.length > 0 ? (
                                    data.nearbySpots.map((spot, index) => (
                                        <div
                                            key={spot.osmId || index}
                                            className="p-5 rounded-3xl glass-card border border-white/10 hover:border-[var(--accent)]/40 transition-all flex flex-col justify-between space-y-4 group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-5 h-5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold flex items-center justify-center shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <h3 className="font-bold text-sm sm:text-base text-[var(--text)] truncate">
                                                            {spot.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-muted)] pl-7">
                                                        {spot.type} • {spot.distanceKm.toFixed(2)} km away
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Match Score</span>
                                                    <span className="text-sm font-extrabold text-[var(--accent)]">
                                                        {Math.round(spot.suitabilityScore)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                                <span className="text-[11px] text-[var(--text-muted)]">
                                                    Scenic outdoor route
                                                </span>
                                                <a
                                                    href={spot.mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-all"
                                                >
                                                    <span>Open in Maps</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 p-8 text-center glass-card rounded-3xl border border-white/10 text-xs text-[var(--text-muted)]">
                                        No specific parks or trails found within immediate radius. Your local neighborhood loop is recommended!
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Environment;
