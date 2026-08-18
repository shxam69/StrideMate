import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { DashboardData, UserProgress, DailyQuest } from '../types';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ActivityChart from '../components/ActivityChart';
import ActivityList from '../components/ActivityList';
import StreakWidget from '../components/StreakWidget';
import LevelCard from '../components/LevelCard';
import DailyQuestsCard from '../components/DailyQuestsCard';
import DailyEnergyWidget from '../components/DailyEnergyWidget';
import { Trophy, Activity, Medal, Heart, ArrowRight, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
    const { user, updateUser, refreshUser } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [progression, setProgression] = useState<UserProgress | null>(null);
    const [todayQuests, setTodayQuests] = useState<DailyQuest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                await refreshUser();

                const [dashRes, progRes, questsRes] = await Promise.all([
                    api.get('/dashboard/me'),
                    api.get('/progression'),
                    api.get('/quests/today')
                ]);

                setData(dashRes.data);
                setProgression(progRes.data);
                setTodayQuests(questsRes.data);

                if (dashRes.data?.user) {
                    updateUser(dashRes.data.user);
                }
            } catch (err) {
                console.error(err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
            </div>
        );
    }

    if (!data) return null;

    const favoriteSport = data.sportBreakdown.length > 0 
        ? data.sportBreakdown.reduce((prev, current) => (prev.points > current.points) ? prev : current).sport.replace('_', ' ')
        : 'None';

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const isProfileComplete = Boolean(user?.profileCompleted ?? data.user.profileCompleted);

    return (
        <div className="min-h-screen pb-16">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10 space-y-8">
                {/* Greeting & Quick Action */}
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold text-[var(--text)] tracking-tight mb-2">
                            {greeting()}, <span className="text-[var(--accent)]">{data.user.firstName.toUpperCase()}</span>
                        </h1>
                        <p className="text-base md:text-lg text-[var(--text-muted)]">Here's your fitness progression, daily missions, and training stats.</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link
                            to="/add-activity"
                            className="auth-submit-btn px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Log Workout</span>
                        </Link>

                        {isProfileComplete ? (
                            <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <span>Complete</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/profile')}
                                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] group"
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                <span>Profile Incomplete</span>
                                <span className="text-[10px] underline opacity-80 group-hover:opacity-100 ml-1">Complete →</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Gamification Top Row (Level Card + Streak Widget) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <LevelCard
                        level={progression?.level || 1}
                        xp={progression?.xp || 0}
                        nextLevelXp={progression?.nextLevelXp || 100}
                        totalXp={progression?.totalXp || 0}
                    />
                    <StreakWidget
                        currentStreak={progression?.currentStreak || 0}
                        longestStreak={progression?.longestStreak || 0}
                        last7DaysActive={progression?.last7DaysActive}
                    />
                </div>

                {/* Motivational Energy + Daily Quests Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-1">
                        <DailyEnergyWidget dailyEnergy={progression?.dailyEnergy || 80} />
                    </div>
                    <div className="lg:col-span-2">
                        <DailyQuestsCard quests={todayQuests} />
                    </div>
                </div>
                
                {/* Lifetime Metrics Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                    <StatCard 
                        title="Total Points" 
                        value={data.summary.totalPoints.toLocaleString()} 
                        icon={Trophy} 
                        colorClass="text-[var(--accent)]" 
                        bgClass="bg-[var(--accent)]/10 border-[var(--accent)]/20"
                    />
                    <StatCard 
                        title="Global Rank" 
                        value={data.summary.currentRank > 0 ? `#${data.summary.currentRank}` : 'Unranked'} 
                        icon={Medal} 
                        colorClass="text-amber-500" 
                        bgClass="bg-amber-500/10 border-amber-500/20"
                    />
                    <StatCard 
                        title="Activities" 
                        value={data.summary.totalActivities.toLocaleString()} 
                        icon={Activity} 
                        colorClass="text-[var(--success)]" 
                        bgClass="bg-[var(--success)]/10 border-[var(--success)]/20"
                    />
                    <StatCard 
                        title="Top Sport" 
                        value={favoriteSport} 
                        icon={Heart} 
                        colorClass="text-[var(--danger)]" 
                        bgClass="bg-[var(--danger)]/10 border-[var(--danger)]/20"
                    />
                </div>

                {/* Volume Chart */}
                <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[var(--accent)]" /> Training Volume
                        </h3>
                        <Link to="/analytics" className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1">
                            Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <ActivityChart volume={data.volumeOverTime} breakdown={data.sportBreakdown} />
                </div>
                
                {/* Recent Activities Section with link to full history */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-white">Recent Activities</h3>
                        <Link to="/history" className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1">
                            View All History ({data.summary.totalActivities}) <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <ActivityList activities={data.activityHistory} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
