import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, Trophy } from 'lucide-react';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-indigo-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <Activity className="h-8 w-8 text-white" />
                        <span className="font-bold text-xl tracking-tight">StrideMate</span>
                    </div>
                    {user && (
                        <div className="flex items-center space-x-6">
                            <Link to="/dashboard" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                                <LayoutDashboard className="h-5 w-5" />
                                <span>Dashboard</span>
                            </Link>
                            <Link to="/leaderboard" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                                <Trophy className="h-5 w-5" />
                                <span>Leaderboard</span>
                            </Link>
                            <div className="border-l border-indigo-400 h-6 mx-2"></div>
                            <span className="font-medium">{user.firstName} {user.lastName}</span>
                            <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-red-300 transition">
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
