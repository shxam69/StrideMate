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
    userId?: string;
    sport: string;
    distanceKm?: number;
    durationMinutes?: number;
    durationSeconds?: number;
    totalDurationSeconds?: number;
    walkingDurationSeconds?: number;
    joggingDurationSeconds?: number;
    runningDurationSeconds?: number;
    cyclingDurationSeconds?: number;
    calories?: number;
    steps?: number;
    points: number;
    startedAt?: string;
    endedAt?: string;
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

// Gamification Types
export interface UserProgress {
    userId: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    last7DaysActive: boolean[];
    dailyEnergy: number;
}

export interface DailyQuest {
    id: string;
    questDate: string;
    questType: 'MOVE_TIME' | 'DISTANCE' | 'COMPLETE_ACTIVITY' | 'EARN_POINTS';
    title: string;
    description: string;
    targetValue: number;
    currentProgress: number;
    rewardXp: number;
    completed: boolean;
}

export interface Achievement {
    code: string;
    name: string;
    description: string;
    icon: string;
    rewardXp: number;
    requirementDescription: string;
    unlocked: boolean;
    unlockedAt?: string;
}

export interface ActivitySaveResult {
    activity: ActivityHistory;
    pointsEarned: number;
    xpEarned: number;
    currentXp: number;
    nextLevelXp: number;
    totalXp: number;
    level: number;
    levelUp: boolean;
    previousLevel: number;
    currentStreak: number;
    longestStreak: number;
    streakMaintained: boolean;
    completedQuests: DailyQuest[];
    unlockedAchievements: Achievement[];
}

// Analytics Types
export interface DailyVolume {
    date: string;
    dayOfWeek: string;
    points: number;
    calories: number;
    distanceKm: number;
    activityCount: number;
}

export interface AnalyticsData {
    totalActivities: number;
    totalDistanceKm: number;
    totalDurationSeconds: number;
    totalCalories: number;
    totalPoints: number;
    weeklyActivityCount: number;
    weeklyDistanceKm: number;
    weeklyCalories: number;
    weeklyPoints: number;
    currentStreak: number;
    longestStreak: number;
    dailyVolumeLast7Days: DailyVolume[];
    sportDistributionCount: Record<string, number>;
    sportDistributionPoints: Record<string, number>;
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

// Phase 6: Environment Intelligence Types
export interface LocationInfo {
    latitude: number;
    longitude: number;
}

export interface WeatherInfo {
    temperatureC: number;
    feelsLikeC: number;
    humidityPercent: number;
    windSpeedKmh: number;
    precipitationMm: number;
    weatherCode: number;
}

export interface AirQualityInfo {
    aqi: number;
    pm25: number;
    pm10: number;
    dust: number;
    ozone: number;
    nitrogenDioxide: number;
    sulphurDioxide: number;
    carbonMonoxide: number;
}

export interface RunningSpot {
    name: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
    type: string;
    osmId?: number;
    suitabilityScore: number;
    mapsUrl: string;
}

export interface EnvironmentResponse {
    location: LocationInfo;
    weather: WeatherInfo;
    airQuality: AirQualityInfo;
    uvIndex: number;
    condition: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'AVOID';
    runningScore: number;
    recommendation: string;
    nearbySpots: RunningSpot[];
}

// Phase 7: Safety & SOS Types
export interface SosRequest {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    activityId?: string | null;
    clientRequestId?: string;
}

export interface SosResponse {
    eventId: string;
    status: 'SENT' | 'PARTIALLY_SENT' | 'FAILED';
    locationUrl: string;
    sms: 'SENT' | 'FAILED' | 'SKIPPED' | 'MOCK_SENT';
    whatsapp: 'SENT' | 'FAILED' | 'SKIPPED' | 'MOCK_SENT';
    call: 'SENT' | 'FAILED' | 'SKIPPED' | 'MOCK_SENT';
    message: string;
    triggeredAt: string;
    contactName?: string;
    contactPhone?: string;
}

export interface EmergencyEvent {
    id: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    activityId?: string;
    triggeredAt: string;
    status: 'TRIGGERED' | 'RESOLVED' | 'FAILED';
    smsStatus?: string;
    whatsappStatus?: string;
    callStatus?: string;
    message?: string;
    resolvedAt?: string;
}

