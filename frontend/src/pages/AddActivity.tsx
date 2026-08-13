import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Flame, Footprints, Bike, Droplets, Dumbbell, Activity, Check } from 'lucide-react';

const SPORTS = [
    { id: 'RUNNING', label: 'Running', icon: Flame, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10 border-[var(--danger)]/30' },
    { id: 'WALKING', label: 'Walking', icon: Footprints, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10 border-[var(--success)]/30' },
    { id: 'CYCLING', label: 'Cycling', icon: Bike, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
    { id: 'SWIMMING', label: 'Swimming', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { id: 'GYM', label: 'Gym', icon: Dumbbell, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30' },
    { id: 'DAILY_STEPS', label: 'Daily Steps', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' }
];

const AddActivity: React.FC = () => {
    const [sport, setSport] = useState<string>('RUNNING');
    const [distance, setDistance] = useState('');
    const [durationMin, setDurationMin] = useState('');
    const [durationSec, setDurationSec] = useState('');
    const [steps, setSteps] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const payload: any = { sport };
            if (['RUNNING', 'WALKING', 'CYCLING'].includes(sport)) {
                payload.distanceKm = parseFloat(distance);
            } else if (['SWIMMING', 'GYM'].includes(sport)) {
                payload.durationMinutes = parseInt(durationMin || '0', 10);
                payload.durationSeconds = parseInt(durationSec || '0', 10);
            } else if (sport === 'DAILY_STEPS') {
                payload.steps = parseInt(steps, 10);
            }
            
            await api.post('/activities', payload);
            setSuccess(true);
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
            
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to log activity. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const renderInputFields = () => {
        if (['RUNNING', 'WALKING', 'CYCLING'].includes(sport)) {
            return (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Distance (km)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        min="0.1" 
                        required 
                        value={distance} 
                        onChange={e => setDistance(e.target.value)} 
                        className="glass-input h-12" 
                        placeholder="e.g. 5.2"
                    />
                </div>
            );
        }
        
        if (['SWIMMING', 'GYM'].includes(sport)) {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Minutes</label>
                        <input 
                            type="number" 
                            min="0" 
                            required 
                            value={durationMin} 
                            onChange={e => setDurationMin(e.target.value)} 
                            className="glass-input h-12" 
                            placeholder="e.g. 45"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Seconds</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="59"
                            value={durationSec} 
                            onChange={e => setDurationSec(e.target.value)} 
                            className="glass-input h-12" 
                            placeholder="e.g. 30"
                        />
                    </div>
                </div>
            );
        }
        
        if (sport === 'DAILY_STEPS') {
            return (
                <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Total Steps</label>
                    <input 
                        type="number" 
                        min="1" 
                        required 
                        value={steps} 
                        onChange={e => setSteps(e.target.value)} 
                        className="glass-input h-12" 
                        placeholder="e.g. 10000"
                    />
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className="min-h-screen relative z-10">
            <Navbar />
            
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="glass-card p-6 sm:p-10">
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight mb-2">Log Activity</h1>
                        <p className="text-sm md:text-base text-[var(--text-muted)]">Record a new activity to earn points and climb the leaderboard.</p>
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-[var(--success)]/20 border border-[var(--success)]/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_var(--success)]">
                                <Check className="w-8 h-8 text-[var(--success)]" />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Activity Logged!</h3>
                            <p className="text-[var(--text-muted)]">Heading back to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                            {error && (
                                <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-3 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-3 md:mb-4">Select Activity Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                                    {SPORTS.map(s => {
                                        const isSelected = sport === s.id;
                                        const Icon = s.icon;
                                        return (
                                            <div 
                                                key={s.id}
                                                onClick={() => setSport(s.id)}
                                                className={`cursor-pointer rounded-xl border p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-200 min-h-[96px] ${
                                                    isSelected 
                                                        ? `${s.bg} shadow-lg scale-[1.02]` 
                                                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                                                }`}
                                            >
                                                <Icon className={`w-6 h-6 md:w-8 md:h-8 ${isSelected ? s.color : 'text-[var(--text-muted)]'}`} />
                                                <span className={`text-xs md:text-sm font-medium ${isSelected ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border)]">
                                {renderInputFields()}
                            </div>

                            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors h-[48px]"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] transition-all duration-200 shadow-[0_0_20px_var(--glow-blue)] disabled:opacity-70 disabled:cursor-not-allowed h-[48px]"
                                >
                                    {loading ? 'Saving...' : 'Save Activity'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AddActivity;
