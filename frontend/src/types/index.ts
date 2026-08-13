export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    phoneVerified?: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ActivityHistory {
    activityId: string;
    sport: string;
    distanceKm?: number;
    durationMinutes?: number;
    durationSeconds?: number;
    steps?: number;
    points: number;
    recordedAt: string;
}

export interface VolumeOverTime {
    date: string;
    points: number;
    activityCount: number;
}

export interface SportBreakdown {
    sport: string;
    activityCount: number;
    points: number;
}

export interface DashboardSummary {
    totalPoints: number;
    totalActivities: number;
    currentRank: number;
}

export interface DashboardStreak {
    currentStreak: number;
    longestStreak: number;
    activeToday: boolean;
    lastActivityDate: string | null;
}

export interface DashboardData {
    user: User;
    summary: DashboardSummary;
    streaks: DashboardStreak;
    activityHistory: ActivityHistory[];
    volumeOverTime: VolumeOverTime[];
    sportBreakdown: SportBreakdown[];
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    firstName: string;
    lastName: string;
    totalPoints: number;
    trend: 'UP' | 'DOWN' | 'FLAT' | 'NONE';
}
