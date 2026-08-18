import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, Trophy, Plus, Menu, X, Sun, Moon, User, History, BarChart3 } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/history', label: 'History', icon: History },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { path: '/add-activity', label: 'Add Activity', icon: Plus },
        { path: '/profile', label: 'Profile', icon: User },
    ];

    const ThemeToggleBtn = ({ isMobile = false }) => (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center
                ${isMobile 
                    ? 'w-full bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--accent)] hover:border-[var(--glass-border-hover)]'
                }`}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
            {isMobile && <span className="ml-3 font-medium">Toggle Theme</span>}
        </button>
    );

    return (
        <header className="sticky top-0 z-40 w-full">
            {/* Backdrop overlay */}
            {user && mobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-10 bg-[var(--bg)]/80 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <nav className="relative z-20 w-full glass-panel border-b border-[var(--glass-border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to="/dashboard" className="flex items-center space-x-3 group">
                        <div className="bg-[var(--accent)]/10 p-2 rounded-xl border border-[var(--accent)]/20 shadow-[0_0_15px_var(--glow-purple)] group-hover:scale-105 transition-transform">
                            <Activity className="h-6 w-6 text-[var(--accent)]" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-[var(--text)]">StrideMate</span>
                    </Link>

                    {/* Desktop Menu */}
                    {user && (
                        <div className="hidden lg:flex items-center space-x-8">
                            <div className="flex items-center space-x-6">
                                {navLinks.map(link => {
                                    const isActive = location.pathname === link.path;
                                    const Icon = link.icon;
                                    return (
                                        <Link 
                                            key={link.path} 
                                            to={link.path} 
                                            className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                                            <span>{link.label}</span>
                                            {link.path === '/profile' && (
                                                <span 
                                                    className={`w-2 h-2 rounded-full ${user.profileCompleted ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'}`}
                                                    title={user.profileCompleted ? 'Profile complete' : 'Profile incomplete'}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                            
                            <div className="h-8 w-px bg-[var(--border)]"></div>
                            
                            <div className="flex items-center space-x-4">
                                <ThemeToggleBtn />
                                
                                <Link 
                                    to="/profile" 
                                    className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                                    title="View Profile"
                                >
                                    <div className="relative">
                                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                                            {getAvatarUrl(user.profilePhoto) ? (
                                                <img 
                                                    src={getAvatarUrl(user.profilePhoto)!} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            <span className={getAvatarUrl(user.profilePhoto) ? 'hidden' : 'block'}>
                                                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                            </span>
                                        </div>
                                        <span 
                                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg)] ${user.profileCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        />
                                    </div>
                                    <span className="font-medium text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                                        {user.firstName} {user.lastName}
                                    </span>
                                </Link>

                                <button 
                                    onClick={handleLogout} 
                                    className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--danger)]/10 hover:border-[var(--danger)]/30 hover:text-[var(--danger)] text-[var(--text-muted)] transition-all duration-200 group"
                                    title="Logout"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-5 w-5 group-hover:text-[var(--danger)] transition-colors" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    {user && (
                        <div className="lg:hidden flex items-center space-x-3">
                            <ThemeToggleBtn />
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Toggle mobile menu"
                                className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {user && mobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 z-20 bg-[var(--bg)] border-b border-[var(--border)] shadow-2xl">
                    <div className="bg-[var(--surface-elevated)] w-full">
                        <div className="px-4 py-4 space-y-2">
                        {navLinks.map(link => {
                            const isActive = location.pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors ${isActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className="h-5 w-5" />
                                        <span className="font-medium text-base">{link.label}</span>
                                    </div>
                                    {link.path === '/profile' && (
                                        <span 
                                            className={`w-2.5 h-2.5 rounded-full ${user.profileCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                        <div className="border-t border-[var(--border)] my-4 pt-4">
                            <Link
                                to="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-4 pb-3 flex items-center justify-between text-sm text-[var(--text)] font-medium"
                            >
                                <span>Signed in as {user.firstName} {user.lastName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${user.profileCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {user.profileCompleted ? '🟢 Complete' : '🟡 Incomplete'}
                                </span>
                            </Link>
                            
                            <button 
                                onClick={handleLogout}
                                className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-[var(--danger)] hover:bg-[var(--danger)]/10 w-full text-left transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium text-base">Logout</span>
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
