import React, { useEffect, useState } from 'react';
import type { DashboardData } from '../types';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ActivityChart from '../components/ActivityChart';
import ActivityList from '../components/ActivityList';
import StreakCard from '../components/StreakCard';
import { Trophy, Activity, Medal, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/me');
                setData(res.data);
            } catch (err) {
                console.error(err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
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

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 relative z-10">
                <div className="mb-8 md:mb-10 relative">
                    <h1 className="text-3xl md:text-5xl font-bold text-[var(--text)] tracking-tight mb-2">
                        {greeting()}, <span className="text-[var(--accent)]">{data.user.firstName.toUpperCase()}</span>
                    </h1>
                    <p className="text-base md:text-lg text-[var(--text-muted)]">Here's what's happening with your fitness journey today.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-10">
                    <StreakCard 
                        currentStreak={data.streaks.currentStreak}
                        longestStreak={data.streaks.longestStreak}
                        activeToday={data.streaks.activeToday}
                    />
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

                <div className="mb-8 md:mb-10 w-full overflow-hidden">
                    <ActivityChart volume={data.volumeOverTime} breakdown={data.sportBreakdown} />
                </div>
                
                <div className="mb-8 md:mb-10">
                    <ActivityList activities={data.activityHistory} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
