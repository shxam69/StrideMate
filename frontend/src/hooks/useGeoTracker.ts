import { useState, useEffect, useRef, useCallback } from 'react';
import type { DetectedActivity, MovementBreakdown } from '../types';

// ==========================================
// CONFIGURABLE CONSTANTS (Thresholds & Hysteresis)
// ==========================================
export const TRACKER_CONFIG = {
    SPEED_THRESHOLDS: {
        IDLE_MAX: 0.8,       // km/h: Below this is stationary / idle
        WALKING_MAX: 6.0,    // km/h: 0.8 - 6.0 is Walking
        JOGGING_MAX: 10.0,   // km/h: 6.0 - 10.0 is Jogging
        RUNNING_MAX: 24.0,   // km/h: 10.0 - 24.0 is Running
        CYCLING_MIN: 20.0,   // km/h: In auto mode, sustained speeds > 20 km/h classify as Cycling
    },
    SMOOTHING_WINDOW_SIZE: 4,      // Average across last 4 consecutive samples
    HYSTERESIS_SAMPLES: 3,         // Require 3 consecutive stable candidate samples to switch activity
    MIN_ACCURACY_METERS: 65,       // Filter out inaccurate GPS fixes (>65m)
    MAX_SPEED_ANOMALY_KMH: 70.0,   // Discard impossible GPS jumps / anomalies
    MIN_DISTANCE_STEP_METERS: 0.8, // Minimum distance in meters to accumulate (filters stationary GPS drift)
};

// Haversine formula to compute distance in kilometers
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export type GpsPermissionStatus = 
    | 'PROMPT' 
    | 'REQUESTING' 
    | 'GRANTED' 
    | 'DENIED' 
    | 'INSECURE_CONTEXT' 
    | 'UNAVAILABLE' 
    | 'ERROR';

export interface DevTelemetry {
    isSecureContext: boolean;
    isGeolocationAvailable: boolean;
    permissionQueryState: string;
    gpsStatus: GpsPermissionStatus;
    samplesReceived: number;
    gpsAccuracy: number | null;
    lastErrorCode: number | null;
    lastErrorMessage: string | null;
    rawBrowserSpeedKmh: number | null;
    calculatedCoordSpeedKmh: number;
    resolvedSpeedKmh: number;
    smoothedSpeedKmh: number;
    lastDistanceIncMeters: number;
    totalDistanceKm: number;
    lastFixTime: string;
}

export interface UseGeoTrackerReturn {
    status: 'idle' | 'tracking' | 'paused' | 'stopped';
    elapsedSeconds: number;
    currentActivity: DetectedActivity;
    currentSpeedKmh: number;
    currentPace: string;
    totalDistanceKm: number;
    breakdown: MovementBreakdown;
    dominantSport: string;
    estimatedCalories: number;
    estimatedPoints: number;
    gpsAccuracy: number | null;
    gpsStatus: GpsPermissionStatus;
    error: string | null;
    isSimulating: boolean;
    simulatedPreset: 'WALK' | 'JOG' | 'RUN' | 'PAUSE' | 'IDLE';
    devTelemetry: DevTelemetry;
    setIsSimulating: (val: boolean) => void;
    setSimulatedPreset: (preset: 'WALK' | 'JOG' | 'RUN' | 'PAUSE' | 'IDLE') => void;
    startTracking: (preferredSport?: string) => void;
    pauseTracking: () => void;
    resumeTracking: () => void;
    stopTracking: () => void;
    resetTracker: () => void;
    startedAt: string | null;
    endedAt: string | null;
    routePoints: Array<{ latitude: number; longitude: number; accuracy?: number; speed?: number; recordedAt: string }>;
}

export const useGeoTracker = (): UseGeoTrackerReturn => {
    const [status, setStatus] = useState<'idle' | 'tracking' | 'paused' | 'stopped'>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [currentActivity, setCurrentActivity] = useState<DetectedActivity>('IDLE');
    const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
    const [totalDistanceKm, setTotalDistanceKm] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<MovementBreakdown>({
        walkingSeconds: 0,
        joggingSeconds: 0,
        runningSeconds: 0,
        cyclingSeconds: 0,
        idleSeconds: 0,
    });
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [gpsStatus, setGpsStatus] = useState<GpsPermissionStatus>('PROMPT');
    const [error, setError] = useState<string | null>(null);
    const [routePoints, setRoutePoints] = useState<Array<{ latitude: number; longitude: number; accuracy?: number; speed?: number; recordedAt: string }>>([]);
    
    // Simulator configuration
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simulatedPreset, setSimulatedPresetState] = useState<'WALK' | 'JOG' | 'RUN' | 'PAUSE' | 'IDLE'>('WALK');

    // DEV Telemetry state
    const [devTelemetry, setDevTelemetry] = useState<DevTelemetry>({
        isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
        isGeolocationAvailable: typeof navigator !== 'undefined' && 'geolocation' in navigator && !!navigator.geolocation,
        permissionQueryState: 'unknown',
        gpsStatus: 'PROMPT',
        samplesReceived: 0,
        gpsAccuracy: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        rawBrowserSpeedKmh: null,
        calculatedCoordSpeedKmh: 0,
        resolvedSpeedKmh: 0,
        smoothedSpeedKmh: 0,
        lastDistanceIncMeters: 0,
        totalDistanceKm: 0,
        lastFixTime: '--',
    });

    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [endedAt, setEndedAt] = useState<string | null>(null);

    // Internal mutable refs for real-time sensor processing
    const currentActivityRef = useRef<DetectedActivity>('IDLE');
    const statusRef = useRef<'idle' | 'tracking' | 'paused' | 'stopped'>('idle');
    const isSimulatingRef = useRef<boolean>(false);
    const targetSimSpeedRef = useRef<number>(4.2); // Default to Walk ~4.2 km/h
    const samplesCountRef = useRef<number>(0);
    const routePointsRef = useRef<Array<{ latitude: number; longitude: number; accuracy?: number; speed?: number; recordedAt: string }>>([]);
    const lastRecordedPointTimeRef = useRef<number>(0);

    const watchIdRef = useRef<number | null>(null);
    const lastCoordRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
    const speedWindowRef = useRef<number[]>([]);
    const candidateActivityRef = useRef<DetectedActivity>('IDLE');
    const candidateSampleCountRef = useRef<number>(0);
    const preferredSportRef = useRef<string>('AUTO');

    // Simulation synthetic GPS coordinate generator
    const simLatRef = useRef<number>(37.7749);
    const simLngRef = useRef<number>(-122.4194);
    const simHeadingRef = useRef<number>(45); // degrees

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        isSimulatingRef.current = isSimulating;
    }, [isSimulating]);

    // Initial inspection on mount: SecureContext and Permissions API query
    useEffect(() => {
        const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
        const isGeoAvail = typeof navigator !== 'undefined' && 'geolocation' in navigator && !!navigator.geolocation;

        let initialStatus: GpsPermissionStatus = 'PROMPT';
        if (!isGeoAvail) {
            initialStatus = 'UNAVAILABLE';
        } else if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            initialStatus = 'INSECURE_CONTEXT';
        }

        setGpsStatus(initialStatus);

        setDevTelemetry(prev => ({
            ...prev,
            isSecureContext: isSecure,
            isGeolocationAvailable: isGeoAvail,
            gpsStatus: initialStatus,
        }));

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName })
                .then((permissionStatus) => {
                    const stateStr = permissionStatus.state; // 'granted' | 'prompt' | 'denied'
                    setDevTelemetry(prev => ({ ...prev, permissionQueryState: stateStr }));
                    
                    if (stateStr === 'denied') {
                        setGpsStatus('DENIED');
                    } else if (stateStr === 'granted' && initialStatus !== 'INSECURE_CONTEXT') {
                        // Keep prompt or ready until real sample is received
                    }

                    permissionStatus.onchange = () => {
                        const newState = permissionStatus.state;
                        setDevTelemetry(prev => ({ ...prev, permissionQueryState: newState }));
                        if (newState === 'denied') setGpsStatus('DENIED');
                        else if (newState === 'granted') setGpsStatus('GRANTED');
                    };
                })
                .catch(() => {
                    setDevTelemetry(prev => ({ ...prev, permissionQueryState: 'unsupported-query' }));
                });
        }
    }, []);

    // Core Classification Logic (Smooth Speed + Hysteresis)
    const classifySpeed = useCallback((rawSpeedKmh: number) => {
        const { SPEED_THRESHOLDS, SMOOTHING_WINDOW_SIZE, HYSTERESIS_SAMPLES, MAX_SPEED_ANOMALY_KMH } = TRACKER_CONFIG;

        if (rawSpeedKmh < 0 || rawSpeedKmh > MAX_SPEED_ANOMALY_KMH) {
            return;
        }

        // 1. Sliding Window Speed Smoothing
        speedWindowRef.current.push(rawSpeedKmh);
        if (speedWindowRef.current.length > SMOOTHING_WINDOW_SIZE) {
            speedWindowRef.current.shift();
        }

        const smoothedSpeed = speedWindowRef.current.reduce((a, b) => a + b, 0) / speedWindowRef.current.length;
        const formattedSmoothed = parseFloat(smoothedSpeed.toFixed(1));
        setCurrentSpeedKmh(formattedSmoothed);

        // 2. Candidate Activity Determination
        let candidate: DetectedActivity = 'IDLE';
        const isCyclingMode = preferredSportRef.current === 'CYCLING';

        if (isCyclingMode) {
            candidate = smoothedSpeed >= SPEED_THRESHOLDS.IDLE_MAX ? 'CYCLING' : 'IDLE';
        } else if (smoothedSpeed < SPEED_THRESHOLDS.IDLE_MAX) {
            candidate = 'IDLE';
        } else if (smoothedSpeed <= SPEED_THRESHOLDS.WALKING_MAX) {
            candidate = 'WALKING';
        } else if (smoothedSpeed <= SPEED_THRESHOLDS.JOGGING_MAX) {
            candidate = 'JOGGING';
        } else if (smoothedSpeed <= SPEED_THRESHOLDS.RUNNING_MAX) {
            candidate = 'RUNNING';
        } else {
            candidate = 'CYCLING';
        }

        // 3. Hysteresis (Requires N consecutive stable candidate samples to switch activity)
        if (candidate === candidateActivityRef.current) {
            candidateSampleCountRef.current += 1;
        } else {
            candidateActivityRef.current = candidate;
            candidateSampleCountRef.current = 1;
        }

        if (candidateSampleCountRef.current >= HYSTERESIS_SAMPLES) {
            currentActivityRef.current = candidate;
            setCurrentActivity(candidate);
        }

        return formattedSmoothed;
    }, []);

    // Real-Time GPS Telemetry Processing Pipeline
    const processGpsSample = useCallback((sample: { latitude: number; longitude: number; accuracy: number; speedMps: number | null; timestamp: number }) => {
        if (statusRef.current !== 'tracking') return;

        samplesCountRef.current += 1;
        const { latitude, longitude, accuracy, speedMps, timestamp } = sample;
        const roundedAcc = Math.round(accuracy);
        
        // Mark as GRANTED / Real GPS Fix received
        setGpsStatus('GRANTED');
        setGpsAccuracy(roundedAcc);
        setError(null);

        // Skip inaccurate GPS fixes (>65m)
        if (accuracy > TRACKER_CONFIG.MIN_ACCURACY_METERS) {
            setDevTelemetry(prev => ({
                ...prev,
                samplesReceived: samplesCountRef.current,
                gpsAccuracy: roundedAcc,
                gpsStatus: 'GRANTED',
                lastFixTime: new Date(timestamp).toLocaleTimeString(),
            }));
            return;
        }

        let distanceKm = 0;
        let calculatedCoordSpeedKmh = 0;
        let rawBrowserSpeedKmh: number | null = (speedMps !== null && speedMps >= 0) ? parseFloat((speedMps * 3.6).toFixed(1)) : null;
        let resolvedSpeedKmh = 0;
        let distIncrementMeters = 0;

        if (lastCoordRef.current) {
            distanceKm = calculateHaversineDistance(
                lastCoordRef.current.lat,
                lastCoordRef.current.lng,
                latitude,
                longitude
            );

            distIncrementMeters = distanceKm * 1000.0;
            const timeDiffSec = (timestamp - lastCoordRef.current.timestamp) / 1000;

            if (timeDiffSec >= 0.25) {
                calculatedCoordSpeedKmh = parseFloat(((distanceKm / (timeDiffSec / 3600))).toFixed(1));

                // SPEED RESOLUTION:
                // Android Chrome often returns speedMps === null OR 0.0 while walking.
                // If browser speed is available and >= 0.8 km/h, use browser speed.
                // Otherwise calculate speed from coordinate delta.
                if (rawBrowserSpeedKmh !== null && rawBrowserSpeedKmh >= 0.8) {
                    resolvedSpeedKmh = rawBrowserSpeedKmh;
                } else if (calculatedCoordSpeedKmh >= 0.8 && distIncrementMeters >= TRACKER_CONFIG.MIN_DISTANCE_STEP_METERS) {
                    resolvedSpeedKmh = calculatedCoordSpeedKmh;
                } else if (distIncrementMeters < TRACKER_CONFIG.MIN_DISTANCE_STEP_METERS && (rawBrowserSpeedKmh === null || rawBrowserSpeedKmh < 0.8)) {
                    // Small GPS stationary jitter (< 0.8m) -> treat as stationary 0 km/h
                    resolvedSpeedKmh = 0.0;
                } else {
                    resolvedSpeedKmh = calculatedCoordSpeedKmh;
                }

                // Check anomaly / teleportation (> 70 km/h)
                if (resolvedSpeedKmh > TRACKER_CONFIG.MAX_SPEED_ANOMALY_KMH) {
                    resolvedSpeedKmh = 0.0;
                    distanceKm = 0.0;
                } else if (resolvedSpeedKmh >= 0.8 && distIncrementMeters >= TRACKER_CONFIG.MIN_DISTANCE_STEP_METERS) {
                    // Accumulate valid distance
                    setTotalDistanceKm(prev => parseFloat((prev + distanceKm).toFixed(4)));
                }

                // Run through smoothing & hysteresis
                const smoothed = classifySpeed(resolvedSpeedKmh);

                // Update DEV Telemetry state
                setDevTelemetry(prev => ({
                    ...prev,
                    samplesReceived: samplesCountRef.current,
                    gpsAccuracy: roundedAcc,
                    gpsStatus: 'GRANTED',
                    rawBrowserSpeedKmh: rawBrowserSpeedKmh,
                    calculatedCoordSpeedKmh: calculatedCoordSpeedKmh,
                    resolvedSpeedKmh: resolvedSpeedKmh,
                    smoothedSpeedKmh: smoothed !== undefined ? smoothed : prev.smoothedSpeedKmh,
                    lastDistanceIncMeters: parseFloat(distIncrementMeters.toFixed(2)),
                    totalDistanceKm: prev.totalDistanceKm + distanceKm,
                    lastFixTime: new Date(timestamp).toLocaleTimeString(),
                }));
            }
        } else {
            // First anchor coordinate fix
            if (rawBrowserSpeedKmh !== null && rawBrowserSpeedKmh >= 0.8) {
                classifySpeed(rawBrowserSpeedKmh);
            }

            setDevTelemetry(prev => ({
                ...prev,
                samplesReceived: samplesCountRef.current,
                gpsAccuracy: roundedAcc,
                gpsStatus: 'GRANTED',
                rawBrowserSpeedKmh: rawBrowserSpeedKmh,
                lastFixTime: new Date(timestamp).toLocaleTimeString(),
            }));
        }

        // Capture GPS Route breadcrumb point (every 3 seconds or initial point)
        if (timestamp - lastRecordedPointTimeRef.current >= 3000 || routePointsRef.current.length === 0) {
            lastRecordedPointTimeRef.current = timestamp;
            const newPt = {
                latitude,
                longitude,
                accuracy: roundedAcc,
                speed: resolvedSpeedKmh,
                recordedAt: new Date(timestamp).toISOString()
            };
            routePointsRef.current.push(newPt);
            setRoutePoints([...routePointsRef.current]);
        }

        lastCoordRef.current = { lat: latitude, lng: longitude, timestamp };
    }, [classifySpeed]);

    // Real Browser Geolocation Callbacks
    const handleRealPositionUpdate = useCallback((position: GeolocationPosition) => {
        if (isSimulatingRef.current) return;

        processGpsSample({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speedMps: position.coords.speed,
            timestamp: position.timestamp || Date.now(),
        });
    }, [processGpsSample]);

    const handlePositionError = useCallback((err: GeolocationPositionError) => {
        if (isSimulatingRef.current) return;

        console.error('[GPS Error]', `Code: ${err.code} (${err.code === 1 ? 'PERMISSION_DENIED' : err.code === 2 ? 'POSITION_UNAVAILABLE' : 'TIMEOUT'})`, err.message);

        setDevTelemetry(prev => ({
            ...prev,
            lastErrorCode: err.code,
            lastErrorMessage: err.message,
            gpsStatus: err.code === 1 ? 'DENIED' : 'ERROR',
        }));

        if (err.code === 1) { // PERMISSION_DENIED
            setGpsStatus('DENIED');
            setError('Location permission was denied. Enable location permission in Chrome site settings or toggle Simulator Mode.');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
            setGpsStatus('ERROR');
            setError(`GPS fix unavailable: ${err.message}. Ensure device GPS is on.`);
        } else if (err.code === 3) { // TIMEOUT
            setGpsStatus('ERROR');
            setError('GPS signal acquisition timed out. Move to an open area.');
        } else {
            setGpsStatus('ERROR');
            setError(`GPS Error (${err.code}): ${err.message}`);
        }
    }, []);

    // 1-Second Master Telemetry & Timer Loop
    useEffect(() => {
        if (status !== 'tracking') return;

        const intervalId = setInterval(() => {
            // 1. Advance elapsed timer
            setElapsedSeconds(prev => prev + 1);

            // 2. Accumulate active segment duration based on current classified activity
            const activeType = currentActivityRef.current;
            setBreakdown(prev => {
                const next = { ...prev };
                switch (activeType) {
                    case 'WALKING': next.walkingSeconds += 1; break;
                    case 'JOGGING': next.joggingSeconds += 1; break;
                    case 'RUNNING': next.runningSeconds += 1; break;
                    case 'CYCLING': next.cyclingSeconds += 1; break;
                    case 'IDLE':
                    default:
                        next.idleSeconds += 1; break;
                }
                return next;
            });

            // 3. In Simulator Mode: synthesize continuous GPS coordinates
            if (isSimulatingRef.current) {
                const baseSpeed = targetSimSpeedRef.current;
                const jitter = baseSpeed > 0 ? (Math.random() * 0.3 - 0.15) : 0;
                const instantSpeedKmh = Math.max(0, baseSpeed + jitter);
                const speedMps = instantSpeedKmh / 3.6;

                const distMeters = speedMps * 1.0;
                const dLat = (distMeters * Math.cos(simHeadingRef.current * (Math.PI / 180))) / 111111;
                const dLng = (distMeters * Math.sin(simHeadingRef.current * (Math.PI / 180))) / (111111 * Math.cos(simLatRef.current * (Math.PI / 180)));

                simLatRef.current += dLat;
                simLngRef.current += dLng;

                processGpsSample({
                    latitude: simLatRef.current,
                    longitude: simLngRef.current,
                    accuracy: 5,
                    speedMps: speedMps,
                    timestamp: Date.now(),
                });
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [status, processGpsSample]);

    // Simulator Preset Handler
    const setSimulatedPreset = useCallback((preset: 'WALK' | 'JOG' | 'RUN' | 'PAUSE' | 'IDLE') => {
        setSimulatedPresetState(preset);
        switch (preset) {
            case 'WALK':
                targetSimSpeedRef.current = 4.2;
                break;
            case 'JOG':
                targetSimSpeedRef.current = 8.0;
                break;
            case 'RUN':
                targetSimSpeedRef.current = 13.0;
                break;
            case 'PAUSE':
            case 'IDLE':
                targetSimSpeedRef.current = 0.0;
                break;
        }
    }, []);

    // Controls
    const startTracking = (preferredSport: string = 'AUTO') => {
        setError(null);
        preferredSportRef.current = preferredSport;
        setStartedAt(new Date().toISOString());
        setEndedAt(null);
        setElapsedSeconds(0);
        setTotalDistanceKm(0);
        setCurrentSpeedKmh(0);
        currentActivityRef.current = preferredSport === 'CYCLING' ? 'CYCLING' : 'IDLE';
        setCurrentActivity(currentActivityRef.current);
        setBreakdown({ walkingSeconds: 0, joggingSeconds: 0, runningSeconds: 0, cyclingSeconds: 0, idleSeconds: 0 });
        speedWindowRef.current = [];
        candidateSampleCountRef.current = 0;
        lastCoordRef.current = null;
        samplesCountRef.current = 0;
        setGpsAccuracy(null);
        routePointsRef.current = [];
        setRoutePoints([]);
        lastRecordedPointTimeRef.current = 0;

        // Check SecureContext and Geolocation API
        const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
        const isGeoAvail = typeof navigator !== 'undefined' && 'geolocation' in navigator && !!navigator.geolocation;

        // Reset dev telemetry
        setDevTelemetry({
            isSecureContext: isSecure,
            isGeolocationAvailable: isGeoAvail,
            permissionQueryState: 'requesting',
            gpsStatus: isSimulating ? 'GRANTED' : (isSecure || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'REQUESTING' : 'INSECURE_CONTEXT'),
            samplesReceived: 0,
            gpsAccuracy: isSimulating ? 5 : null,
            lastErrorCode: null,
            lastErrorMessage: null,
            rawBrowserSpeedKmh: null,
            calculatedCoordSpeedKmh: 0,
            resolvedSpeedKmh: 0,
            smoothedSpeedKmh: 0,
            lastDistanceIncMeters: 0,
            totalDistanceKm: 0,
            lastFixTime: '--',
        });

        // Reset synthetic coordinates
        simLatRef.current = 37.7749;
        simLngRef.current = -122.4194;

        if (isSimulating) {
            setGpsStatus('GRANTED');
            setGpsAccuracy(5);
            if (targetSimSpeedRef.current <= 0) {
                targetSimSpeedRef.current = 4.2;
                setSimulatedPresetState('WALK');
            }
        } else {
            if (!isGeoAvail) {
                setGpsStatus('UNAVAILABLE');
                setError('Geolocation is not supported by your browser or device.');
                setStatus('tracking');
                return;
            }

            if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                setGpsStatus('INSECURE_CONTEXT');
                setError(`Mobile browsers disable Geolocation over plain HTTP. In Chrome on Android, navigate to chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${window.location.origin}, enable it and relaunch; or use Simulator Mode.`);
                setStatus('tracking');
                return;
            }

            setGpsStatus('REQUESTING');

            // Trigger permission & initial position directly from user click interaction
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    handleRealPositionUpdate(pos);

                    // Once initial position succeeds, start the high-accuracy continuous watcher
                    try {
                        const id = navigator.geolocation.watchPosition(
                            handleRealPositionUpdate,
                            handlePositionError,
                            {
                                enableHighAccuracy: true,
                                maximumAge: 0, // Fresh satellite fixes
                                timeout: 15000,
                            }
                        );
                        watchIdRef.current = id;
                    } catch (err: any) {
                        console.error('Failed to start watchPosition', err);
                    }
                },
                (err) => {
                    handlePositionError(err);
                    // Still attempt watchPosition in case it was a transient timeout
                    if (err.code !== 1) {
                        try {
                            const id = navigator.geolocation.watchPosition(
                                handleRealPositionUpdate,
                                handlePositionError,
                                {
                                    enableHighAccuracy: true,
                                    maximumAge: 0,
                                    timeout: 15000,
                                }
                            );
                            watchIdRef.current = id;
                        } catch (e) {
                            console.error('Failed to start fallback watchPosition', e);
                        }
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                }
            );
        }

        setStatus('tracking');
    };

    const pauseTracking = () => {
        setStatus('paused');
        setCurrentSpeedKmh(0);
        targetSimSpeedRef.current = 0;
    };

    const resumeTracking = () => {
        setStatus('tracking');
        if (isSimulating) {
            if (simulatedPreset === 'WALK') targetSimSpeedRef.current = 4.2;
            else if (simulatedPreset === 'JOG') targetSimSpeedRef.current = 8.0;
            else if (simulatedPreset === 'RUN') targetSimSpeedRef.current = 13.0;
            else targetSimSpeedRef.current = 4.2;
        }
    };

    const stopTracking = () => {
        setStatus('stopped');
        setEndedAt(new Date().toISOString());
        setCurrentSpeedKmh(0);
        targetSimSpeedRef.current = 0;

        if (watchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    const resetTracker = () => {
        stopTracking();
        setStatus('idle');
        setElapsedSeconds(0);
        setTotalDistanceKm(0);
        setCurrentSpeedKmh(0);
        currentActivityRef.current = 'IDLE';
        setCurrentActivity('IDLE');
        setBreakdown({ walkingSeconds: 0, joggingSeconds: 0, runningSeconds: 0, cyclingSeconds: 0, idleSeconds: 0 });
        setStartedAt(null);
        setEndedAt(null);
        setError(null);
        setGpsAccuracy(null);
        routePointsRef.current = [];
        setRoutePoints([]);
        lastRecordedPointTimeRef.current = 0;
    };

    // Calculate current pace: min/km
    const currentPace = (() => {
        if (currentSpeedKmh <= 0.5) return '--:--';
        const minutesPerKm = 60 / currentSpeedKmh;
        const mins = Math.floor(minutesPerKm);
        const secs = Math.round((minutesPerKm - mins) * 60);
        if (mins > 59) return '--:--';
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    })();

    // Estimated calories preview
    const estimatedCalories = Math.round(
        (breakdown.walkingSeconds / 60) * 4.5 +
        (breakdown.joggingSeconds / 60) * 8.5 +
        (breakdown.runningSeconds / 60) * 12.0 +
        (breakdown.cyclingSeconds / 60) * 8.0
    );

    // Dominant sport determination for auto-tracked sessions
    const dominantSport = (() => {
        if (preferredSportRef.current === 'CYCLING' || breakdown.cyclingSeconds > (breakdown.walkingSeconds + breakdown.joggingSeconds + breakdown.runningSeconds)) {
            return 'CYCLING';
        }
        if (breakdown.walkingSeconds >= (breakdown.joggingSeconds + breakdown.runningSeconds) && breakdown.walkingSeconds > 0) {
            return 'WALKING';
        }
        if ((breakdown.joggingSeconds + breakdown.runningSeconds) > 0) {
            return 'RUNNING';
        }
        return 'WALKING';
    })();

    // Estimated points preview
    const estimatedPoints = (() => {
        if (totalDistanceKm > 0) {
            const movingSecs = breakdown.walkingSeconds + breakdown.joggingSeconds + breakdown.runningSeconds + breakdown.cyclingSeconds;
            if (movingSecs > 0) {
                const wWalk = breakdown.walkingSeconds * 4.5;
                const wJog = breakdown.joggingSeconds * 8.0;
                const wRun = breakdown.runningSeconds * 12.0;
                const wCycle = breakdown.cyclingSeconds * 20.0;
                const wTotal = wWalk + wJog + wRun + wCycle;
                if (wTotal > 0) {
                    const dWalk = totalDistanceKm * (wWalk / wTotal);
                    const dJog = totalDistanceKm * (wJog / wTotal);
                    const dRun = totalDistanceKm * (wRun / wTotal);
                    const dCycle = totalDistanceKm * (wCycle / wTotal);
                    return Math.max(1, Math.floor(dWalk * 50 + (dJog + dRun) * 100 + dCycle * 25));
                }
            }
        }
        return Math.floor(
            (breakdown.walkingSeconds / 60) * 2 +
            (breakdown.joggingSeconds / 60) * 5 +
            (breakdown.runningSeconds / 60) * 8 +
            (breakdown.cyclingSeconds / 60) * 4
        );
    })();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return {
        status,
        elapsedSeconds,
        currentActivity,
        currentSpeedKmh,
        currentPace,
        totalDistanceKm,
        breakdown,
        dominantSport,
        estimatedCalories,
        estimatedPoints,
        gpsAccuracy,
        gpsStatus,
        error,
        isSimulating,
        simulatedPreset,
        devTelemetry,
        setIsSimulating,
        setSimulatedPreset,
        startTracking,
        pauseTracking,
        resumeTracking,
        stopTracking,
        resetTracker,
        startedAt,
        endedAt,
        routePoints,
    };
};
