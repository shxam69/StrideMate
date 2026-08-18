import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RouteViewer from '../components/RouteViewer';
import ShareActivityCard from '../components/ShareActivityCard';
import StrideLoader from '../components/ui/StrideLoader';
import api from '../services/api';
import type { ActivityHistory as ActivityType, RoutePoint } from '../types';
import { 
    Footprints, 
    Flame, 
    Bike, 
    Droplets, 
    Dumbbell, 
    Calendar, 
    Clock, 
    X, 
    Plus, 
    Filter,
    Activity as ActivityIcon,
    MapPin,
    Share2,
    BarChart3
} from 'lucide-react';

const formatSeconds = (sec?: number): string => {
    if (!sec || sec <= 0) return '00:00';
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hours > 0) {
        return `${hours}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getSportIcon = (sport: string) => {
    switch (sport.toUpperCase()) {
        case 'WALKING': return { icon: Footprints, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
        case 'RUNNING': return { icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
        case 'CYCLING': return { icon: Bike, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' };
        case 'SWIMMING': return { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' };
        case 'GYM': return { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' };
        default: return { icon: ActivityIcon, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
    }
};

const ActivityHistory: React.FC = () => {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSport, setSelectedSport] = useState<string>('ALL');
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

    // Modal Sub-Tabs & Route Telemetry State
    const [modalTab, setModalTab] = useState<'OVERVIEW' | 'ROUTE' | 'SHARE'>('OVERVIEW');
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [routeLoading, setRouteLoading] = useState<boolean>(false);
    const [isPrivacyRoute, setIsPrivacyRoute] = useState<boolean>(true);

    const loadActivityRoute = async (actId: string, privacy: boolean = true) => {
        setRouteLoading(true);
        try {
            const res = await api.get(`/activities/${actId}/route?privacy=${privacy}`);
            setRoutePoints(res.data?.points || []);
        } catch (err) {
            console.warn('No route points for activity', actId);
            setRoutePoints([]);
        } finally {
            setRouteLoading(false);
        }
    };

    const handleOpenActivity = (act: ActivityType) => {
        setSelectedActivity(act);
        setModalTab('OVERVIEW');
        if (act.activityId) {
            loadActivityRoute(act.activityId, isPrivacyRoute);
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/activities');
                setActivities(res.data);
            } catch (err: any) {
                console.error('Failed to load activities', err);
                setError(err.response?.data?.message || 'Failed to load activity history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const filteredActivities = activities.filter(a => {
        if (selectedSport === 'ALL') return true;
        return a.sport.toUpperCase() === selectedSport.toUpperCase();
    });

    const totalDistance = filteredActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    const totalPoints = filteredActivities.reduce((acc, a) => acc + (a.points || 0), 0);
    const totalCalories = filteredActivities.reduce((acc, a) => acc + (a.calories || 0), 0);
    const totalDurationSecs = filteredActivities.reduce((acc, a) => {
        const dur = a.totalDurationSeconds || ((a.durationMinutes || 0) * 60 + (a.durationSeconds || 0));
        return acc + dur;
    }, 0);

    const sportFilters = ['ALL', 'WALKING', 'RUNNING', 'CYCLING', 'GYM', 'SWIMMING'];

    return (
        <div className="min-h-screen relative z-10 pb-16">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                            Activity History
                        </h1>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                            Review your completed training logs, telemetry segmentation, and progression history.
                        </p>
                    </div>

                    <Link
                        to="/add-activity"
                        className="auth-submit-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 self-start shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Log Activity</span>
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                    <Filter className="w-4 h-4 text-white/40 mr-1 flex-shrink-0" />
                    {sportFilters.map((sport) => (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                                selectedSport === sport
                                    ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--glow-purple)]'
                                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                            }`}
                        >
                            {sport}
                        </button>
                    ))}
                </div>

                {/* Summary Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Activities</span>
                        <p className="text-xl font-mono font-black text-white mt-1">{filteredActivities.length}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Distance</span>
                        <p className="text-xl font-mono font-black text-white mt-1">{totalDistance.toFixed(2)} <span className="text-xs font-normal text-white/60">km</span></p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Active Time</span>
                        <p className="text-xl font-mono font-black text-white mt-1">{formatSeconds(totalDurationSecs)}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Calories</span>
                        <p className="text-xl font-mono font-black text-amber-400 mt-1">{totalCalories.toLocaleString()} <span className="text-xs font-normal text-white/60">kcal</span></p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Points</span>
                        <p className="text-xl font-mono font-black text-[var(--accent)] mt-1">+{totalPoints}</p>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)] mx-auto mb-3"></div>
                        <p className="text-xs text-white/50">Loading activity timeline...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                        {error}
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="glass-card p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                            <ActivityIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">No activities recorded yet</h3>
                            <p className="text-xs text-white/50 mt-1">Start tracking your workouts to build your history and level up!</p>
                        </div>
                        <Link
                            to="/add-activity"
                            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Start First Workout</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredActivities.map((act) => {
                            const iconConfig = getSportIcon(act.sport);
                            const IconComponent = iconConfig.icon;
                            const dur = act.totalDurationSeconds || ((act.durationMinutes || 0) * 60 + (act.durationSeconds || 0));

                            const hasBreakdown = (act.walkingDurationSeconds || 0) > 0 || (act.joggingDurationSeconds || 0) > 0 || (act.runningDurationSeconds || 0) > 0 || (act.cyclingDurationSeconds || 0) > 0;
                            const totalMoveSec = (act.walkingDurationSeconds || 0) + (act.joggingDurationSeconds || 0) + (act.runningDurationSeconds || 0) + (act.cyclingDurationSeconds || 0);

                            return (
                                <div
                                    key={act.activityId}
                                    onClick={() => handleOpenActivity(act)}
                                    className="glass-card p-4 sm:p-5 hover:border-[var(--accent)]/50 transition-all cursor-pointer space-y-3 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3.5">
                                            <div className={`p-3 rounded-2xl ${iconConfig.bg} ${iconConfig.border} border ${iconConfig.color}`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="text-base font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                                                        {act.sport}
                                                    </h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                                                        +{act.points} pts
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(act.recordedAt).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {act.distanceKm && act.distanceKm > 0 ? (
                                                <p className="text-lg font-mono font-bold text-white">
                                                    {act.distanceKm.toFixed(2)} <span className="text-xs font-normal text-white/60">km</span>
                                                </p>
                                            ) : null}
                                            <p className="text-xs font-mono text-white/60 flex items-center gap-1 justify-end">
                                                <Clock className="w-3 h-3" />
                                                {formatSeconds(dur)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Segmented breakdown progress bar if present */}
                                    {hasBreakdown && totalMoveSec > 0 && (
                                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-mono text-white/50">
                                                <span>Segmentation</span>
                                                <span>
                                                    {act.walkingDurationSeconds ? `Walk ${Math.round((act.walkingDurationSeconds / totalMoveSec) * 100)}% ` : ''}
                                                    {act.joggingDurationSeconds ? `Jog ${Math.round((act.joggingDurationSeconds / totalMoveSec) * 100)}% ` : ''}
                                                    {act.runningDurationSeconds ? `Run ${Math.round((act.runningDurationSeconds / totalMoveSec) * 100)}%` : ''}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                                                {act.walkingDurationSeconds ? <div style={{ width: `${(act.walkingDurationSeconds / totalMoveSec) * 100}%` }} className="h-full bg-emerald-400"></div> : null}
                                                {act.joggingDurationSeconds ? <div style={{ width: `${(act.joggingDurationSeconds / totalMoveSec) * 100}%` }} className="h-full bg-amber-400"></div> : null}
                                                {act.runningDurationSeconds ? <div style={{ width: `${(act.runningDurationSeconds / totalMoveSec) * 100}%` }} className="h-full bg-rose-500"></div> : null}
                                                {act.cyclingDurationSeconds ? <div style={{ width: `${(act.cyclingDurationSeconds / totalMoveSec) * 100}%` }} className="h-full bg-blue-500"></div> : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Activity Detail Modal with Tabs: Overview, Route & Replay, Share Card */}
                {selectedActivity && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                        <div className="relative w-full max-w-2xl glass-card p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center space-x-3.5">
                                <div className={`p-3 rounded-2xl ${getSportIcon(selectedActivity.sport).bg} border ${getSportIcon(selectedActivity.sport).border} ${getSportIcon(selectedActivity.sport).color}`}>
                                    {React.createElement(getSportIcon(selectedActivity.sport).icon, { className: 'w-7 h-7' })}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-xl font-bold text-white">{selectedActivity.sport} Session</h3>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold">
                                            +{selectedActivity.points} pts
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/50 mt-0.5">
                                        {new Date(selectedActivity.recordedAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Tab Headers */}
                            <div className="flex items-center space-x-2 border-b border-white/10 pb-3 text-xs font-bold">
                                <button
                                    onClick={() => setModalTab('OVERVIEW')}
                                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                                        modalTab === 'OVERVIEW' 
                                            ? 'bg-[var(--accent)] text-white shadow-md' 
                                            : 'bg-white/5 hover:bg-white/10 text-white/60'
                                    }`}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" />
                                    <span>Overview</span>
                                </button>

                                <button
                                    onClick={() => setModalTab('ROUTE')}
                                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                                        modalTab === 'ROUTE' 
                                            ? 'bg-[var(--accent)] text-white shadow-md' 
                                            : 'bg-white/5 hover:bg-white/10 text-white/60'
                                    }`}
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Route & Replay ({routePoints.length})</span>
                                </button>

                                <button
                                    onClick={() => setModalTab('SHARE')}
                                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                                        modalTab === 'SHARE' 
                                            ? 'bg-[var(--accent)] text-white shadow-md' 
                                            : 'bg-white/5 hover:bg-white/10 text-white/60'
                                    }`}
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Share Card</span>
                                </button>
                            </div>

                            {/* Tab 1: Overview */}
                            {modalTab === 'OVERVIEW' && (
                                <div className="space-y-6">
                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] font-bold text-white/50 uppercase">Distance</p>
                                            <p className="text-lg font-mono font-bold text-white mt-1">
                                                {selectedActivity.distanceKm ? `${selectedActivity.distanceKm.toFixed(2)} km` : '--'}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] font-bold text-white/50 uppercase">Duration</p>
                                            <p className="text-lg font-mono font-bold text-white mt-1">
                                                {formatSeconds(selectedActivity.totalDurationSeconds || ((selectedActivity.durationMinutes || 0) * 60 + (selectedActivity.durationSeconds || 0)))}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] font-bold text-white/50 uppercase">Calories</p>
                                            <p className="text-lg font-mono font-bold text-amber-400 mt-1">
                                                {selectedActivity.calories ? `${selectedActivity.calories} kcal` : '--'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Segmentation breakdown if available */}
                                    {((selectedActivity.walkingDurationSeconds || 0) > 0 || (selectedActivity.joggingDurationSeconds || 0) > 0 || (selectedActivity.runningDurationSeconds || 0) > 0 || (selectedActivity.cyclingDurationSeconds || 0) > 0) && (
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Segmentation Breakdown</h4>
                                            <div className="space-y-2 text-xs">
                                                {selectedActivity.walkingDurationSeconds ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                                            <Footprints className="w-4 h-4" /> Walking
                                                        </span>
                                                        <span className="font-mono text-white font-bold">{formatSeconds(selectedActivity.walkingDurationSeconds)}</span>
                                                    </div>
                                                ) : null}
                                                {selectedActivity.joggingDurationSeconds ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1.5 text-amber-400">
                                                            <Flame className="w-4 h-4" /> Jogging
                                                        </span>
                                                        <span className="font-mono text-white font-bold">{formatSeconds(selectedActivity.joggingDurationSeconds)}</span>
                                                    </div>
                                                ) : null}
                                                {selectedActivity.runningDurationSeconds ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1.5 text-rose-400">
                                                            <Flame className="w-4 h-4" /> Running
                                                        </span>
                                                        <span className="font-mono text-white font-bold">{formatSeconds(selectedActivity.runningDurationSeconds)}</span>
                                                    </div>
                                                ) : null}
                                                {selectedActivity.cyclingDurationSeconds ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center gap-1.5 text-blue-400">
                                                            <Bike className="w-4 h-4" /> Cycling
                                                        </span>
                                                        <span className="font-mono text-white font-bold">{formatSeconds(selectedActivity.cyclingDurationSeconds)}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: GPS Route & Replay */}
                            {modalTab === 'ROUTE' && (
                                <div className="space-y-3">
                                    {routeLoading ? (
                                        <div className="py-12">
                                            <StrideLoader size="md" text="Loading GPS route coordinates..." />
                                        </div>
                                    ) : (
                                        <RouteViewer
                                            points={routePoints}
                                            sport={selectedActivity.sport}
                                            totalDistanceKm={selectedActivity.distanceKm}
                                            totalDurationSeconds={selectedActivity.totalDurationSeconds || ((selectedActivity.durationMinutes || 0) * 60 + (selectedActivity.durationSeconds || 0))}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Share Card */}
                            {modalTab === 'SHARE' && (
                                <ShareActivityCard
                                    activity={selectedActivity}
                                    routePoints={routePoints}
                                    privacyTrimmed={isPrivacyRoute}
                                    onTogglePrivacy={(isPrivacy) => {
                                        setIsPrivacyRoute(isPrivacy);
                                        if (selectedActivity.activityId) loadActivityRoute(selectedActivity.activityId, isPrivacy);
                                    }}
                                />
                            )}

                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="auth-submit-btn w-full h-12 rounded-xl text-sm font-bold"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ActivityHistory;
