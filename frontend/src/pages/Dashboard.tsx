import React, { useEffect, useState } from 'react';
import type { DashboardData } from '../types';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ActivityChart from '../components/ActivityChart';
import ActivityList from '../components/ActivityList';
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
                // If 401, they will be caught by protected route or we can navigate to login
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex justify-center items-center">Loading dashboard...</div>;
    }

    if (!data) return null;

    const favoriteSport = data.sportBreakdown.length > 0 
        ? data.sportBreakdown.reduce((prev, current) => (prev.points > current.points) ? prev : current).sport.replace('_', ' ')
        : 'N/A';

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome back, {data.user.firstName}!</h1>
                    <p className="text-slate-500 mt-1">Here is what's happening with your fitness journey today.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Points" value={data.summary.totalPoints} icon={Trophy} colorClass="bg-indigo-500" />
                    <StatCard title="Global Rank" value={data.summary.currentRank > 0 ? `#${data.summary.currentRank}` : 'Unranked'} icon={Medal} colorClass="bg-amber-500" />
                    <StatCard title="Activities" value={data.summary.totalActivities} icon={Activity} colorClass="bg-emerald-500" />
                    <StatCard title="Top Sport" value={favoriteSport} icon={Heart} colorClass="bg-rose-500" />
                </div>

                <ActivityChart volume={data.volumeOverTime} breakdown={data.sportBreakdown} />

                <ActivityList activities={data.activityHistory} />
            </main>
        </div>
    );
};

export default Dashboard;
