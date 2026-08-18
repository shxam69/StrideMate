export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    phoneVerified?: boolean;
    dateOfBirth?: string;
    gender?: string;
    profilePhoto?: string;
    profileCompleted: boolean;
}

export interface EmergencyContact {
    id: string;
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
    createdAt?: string;
    updatedAt?: string;
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
    totalDurationSeconds?: number;
    calories?: number;
    steps?: number;
    points: number;
    recordedAt: string;
}

export type DetectedActivity = 'IDLE' | 'WALKING' | 'JOGGING' | 'RUNNING' | 'CYCLING';

export interface MovementBreakdown {
    walkingSeconds: number;
    joggingSeconds: number;
    runningSeconds: number;
    cyclingSeconds: number;
    idleSeconds: number;
}

export interface LiveActivityPayload {
    sport?: string;
    distanceKm?: number;
    totalDurationSeconds: number;
    walkingDurationSeconds: number;
    joggingDurationSeconds: number;
    runningDurationSeconds: number;
    cyclingDurationSeconds: number;
    calories?: number;
    startedAt: string;
    endedAt: string;
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
