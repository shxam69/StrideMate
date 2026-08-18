import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StrideLoader from '../components/ui/StrideLoader';
import api from '../services/api';
import type { AnalyticsData } from '../types';
import { 
    BarChart3, 
    Flame, 
    Zap, 
    Clock, 
    Calendar, 
    TrendingUp, 
    Activity as ActivityIcon
} from 'lucide-react';

const formatSeconds = (sec?: number): string => {
    if (!sec || sec <= 0) return '0h 0m';
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
};

const getSportColor = (sport: string) => {
    switch (sport.toUpperCase()) {
        case 'WALKING': return 'bg-emerald-400 text-emerald-400';
        case 'RUNNING': return 'bg-rose-400 text-rose-400';
        case 'CYCLING': return 'bg-blue-400 text-blue-400';
        case 'SWIMMING': return 'bg-cyan-400 text-cyan-400';
        case 'GYM': return 'bg-purple-400 text-purple-400';
        default: return 'bg-amber-400 text-amber-400';
    }
};

const Analytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics');
                setAnalytics(res.data);
            } catch (err: any) {
                console.error('Failed to load analytics', err);
                setError(err.response?.data?.message || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const maxChartPoints = analytics?.dailyVolumeLast7Days
        ? Math.max(50, ...analytics.dailyVolumeLast7Days.map(d => d.points))
        : 100;

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                        Fitness Analytics
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                        Authoritative server-side performance metrics, volume charts, and training trends.
                    </p>
                </div>

                {loading ? (
                    <div className="py-24">
                        <StrideLoader size="lg" text="Calculating fitness analytics & lifetime trends..." />
                    </div>
                ) : error || !analytics ? (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                        {error || 'Unable to load analytics data'}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Lifetime KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            <div className="glass-card p-4 sm:p-5 space-y-1">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-[var(--accent)]" /> Total Distance
                                </span>
                                <p className="text-2xl font-mono font-black text-white">
                                    {analytics.totalDistanceKm ? analytics.totalDistanceKm.toFixed(1) : '0.0'} <span className="text-xs font-normal text-white/60">km</span>
                                </p>
                            </div>

                            <div className="glass-card p-4 sm:p-5 space-y-1">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-cyan-400" /> Active Time
                                </span>
                                <p className="text-2xl font-mono font-black text-white">
                                    {formatSeconds(analytics.totalDurationSeconds)}
                                </p>
                            </div>

                            <div className="glass-card p-4 sm:p-5 space-y-1">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-amber-400" /> Calories Burned
                                </span>
                                <p className="text-2xl font-mono font-black text-amber-400">
                                    {analytics.totalCalories.toLocaleString()} <span className="text-xs font-normal text-white/60">kcal</span>
                                </p>
                            </div>

                            <div className="glass-card p-4 sm:p-5 space-y-1">
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-[var(--accent)]" /> Total Points
                                </span>
                                <p className="text-2xl font-mono font-black text-[var(--accent)]">
                                    +{analytics.totalPoints.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* 7-Day Activity Volume Chart */}
                        <div className="glass-card p-5 sm:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                                        7-Day Activity Volume
                                    </h3>
                                    <p className="text-xs text-white/50">Daily point accumulation over the past week</p>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs font-bold text-emerald-400 font-mono">
                                        +{analytics.weeklyPoints} pts this week
                                    </span>
                                </div>
                            </div>

                            {/* Bar Chart Visual */}
                            <div className="pt-4">
                                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-white/10 pb-2">
                                    {analytics.dailyVolumeLast7Days.map((day) => {
                                        const heightPercent = Math.max(8, Math.round((day.points / maxChartPoints) * 100));

                                        return (
                                            <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-[var(--accent)] font-bold">
                                                    +{day.points}
                                                </div>
                                                <div 
                                                    style={{ height: `${heightPercent}%` }}
                                                    className={`w-full max-w-[36px] rounded-xl transition-all duration-500 ${
                                                        day.points > 0
                                                            ? 'bg-gradient-to-t from-[var(--accent)] to-purple-400 shadow-[0_0_15px_var(--glow-purple)] group-hover:scale-105'
                                                            : 'bg-white/5 border border-white/5'
                                                    }`}
                                                />
                                                <div className="text-center">
                                                    <p className="text-[11px] font-bold text-white/80">{day.dayOfWeek}</p>
                                                    <p className="text-[9px] font-mono text-white/40">{day.date.substring(5)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Weekly Breakdown & Streaks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Weekly Summary Card */}
                            <div className="glass-card p-5 sm:p-6 space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-amber-400" />
                                    Weekly Training Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/50 uppercase">Sessions</span>
                                        <p className="text-xl font-mono font-bold text-white mt-1">{analytics.weeklyActivityCount}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/50 uppercase">Distance</span>
                                        <p className="text-xl font-mono font-bold text-white mt-1">{analytics.weeklyDistanceKm ? analytics.weeklyDistanceKm.toFixed(1) : '0.0'} km</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/50 uppercase">Calories</span>
                                        <p className="text-xl font-mono font-bold text-amber-400 mt-1">{analytics.weeklyCalories} kcal</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-bold text-white/50 uppercase">Points</span>
                                        <p className="text-xl font-mono font-bold text-[var(--accent)] mt-1">+{analytics.weeklyPoints}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Streak Performance Card */}
                            <div className="glass-card p-5 sm:p-6 space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-amber-400" />
                                    Consistency & Streaks
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                                        <span className="text-[10px] font-bold text-amber-300 uppercase">Current Streak</span>
                                        <p className="text-3xl font-mono font-black text-white mt-1">{analytics.currentStreak} <span className="text-sm font-normal text-white/60">Days</span></p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center">
                                        <span className="text-[10px] font-bold text-purple-300 uppercase">Best Record</span>
                                        <p className="text-3xl font-mono font-black text-white mt-1">{analytics.longestStreak} <span className="text-sm font-normal text-white/60">Days</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sport Distribution */}
                        <div className="glass-card p-5 sm:p-6 space-y-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <ActivityIcon className="w-5 h-5 text-[var(--accent)]" />
                                Activity Type Distribution
                            </h3>

                            <div className="space-y-3">
                                {Object.keys(analytics.sportDistributionCount).length === 0 ? (
                                    <p className="text-xs text-white/50">No sport breakdown data available yet.</p>
                                ) : (
                                    Object.entries(analytics.sportDistributionCount).map(([sport, count]) => {
                                        const pts = analytics.sportDistributionPoints[sport] || 0;
                                        const pct = Math.round((count / Math.max(1, analytics.totalActivities)) * 100);
                                        const colorClass = getSportColor(sport);

                                        return (
                                            <div key={sport} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-white capitalize">{sport.toLowerCase()}</span>
                                                    <span className="font-mono text-white/70">{count} workouts ({pct}%) • +{pts} pts</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                                                    <div
                                                        style={{ width: `${pct}%` }}
                                                        className={`h-full rounded-full ${colorClass.split(' ')[0]}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Analytics;
