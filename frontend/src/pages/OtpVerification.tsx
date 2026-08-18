import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrbitalOtpInput from '../components/auth/OrbitalOtpInput';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ShieldCheck, RefreshCw, Mail } from 'lucide-react';

const OtpVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Track if verification succeeded so we don't redirect back to /register
    // during AnimatePresence exit animation when location.state is cleared.
    const verifiedRef = useRef(false);
    const hasRequestedRef = useRef(false);

    const { login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Read email from location state once and freeze it in a ref so it
    // survives navigation-triggered location changes during exit animations.
    const emailFromState = location.state?.email as string | undefined;
    const emailRef = useRef<string | undefined>(emailFromState);
    // Only update the ref when we first get a real email value
    if (emailFromState && !emailRef.current) {
        emailRef.current = emailFromState;
    }
    const email = emailRef.current;

    const alreadyRequested = Boolean(location.state?.otpRequested);

    // Guard: redirect to /register only if we never had an email AND verification
    // did not already succeed (prevents redirect during AnimatePresence exit).
    useEffect(() => {
        if (!emailFromState && !email && !verifiedRef.current) {
            console.log('[OTP] No email in state and no cached email — redirecting to /register');
            navigate('/register', { replace: true });
        }
    }, [emailFromState, email, navigate]);

    // Send OTP on mount (only once; skip if registration already sent it)
    useEffect(() => {
        if (!email || hasRequestedRef.current) return;

        if (alreadyRequested) {
            // OTP was already dispatched during registration
            setCountdown(60);
            return;
        }

        hasRequestedRef.current = true;
        sendOtp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    // Countdown timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const sendOtp = async () => {
        setIsSendingOtp(true);
        setErrorMsg('');
        try {
            await api.post('/auth/request-otp', { email });
            setCountdown(60);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Failed to send verification code. Please try again.'
            );
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleComplete = async (code: string): Promise<boolean> => {
        if (!code || code.length !== 6) {
            setErrorMsg('Please enter all 6 digits of your OTP.');
            return false;
        }

        console.log('[OTP] verify started');
        setIsError(false);
        setErrorMsg('');
        setIsVerifying(true);

        try {
            const res = await api.post('/auth/verify-otp', { email, otp: code });

            console.log('[OTP] response:', res.data);
            console.log('[OTP] token exists:', !!res.data?.token);
            console.log('[OTP] user:', res.data?.user);
            console.log('[OTP] profileCompleted:', res.data?.user?.profileCompleted);

            const { token, user } = res.data as { token: string; user: any };

            if (token && user) {
                // Mark as verified BEFORE navigate so the exit-animation guard
                // in the useEffect above does not redirect to /register.
                verifiedRef.current = true;

                // Authenticate: store token + update user state
                login(token, user);

                const destination = user.profileCompleted ? '/dashboard' : '/onboarding';
                console.log('[OTP] navigating to:', destination);

                // Short delay so the success tick/animation in OrbitalOtpInput renders
                setTimeout(() => {
                    navigate(destination, { replace: true });
                }, 1200);

                return true;
            }

            console.log('[OTP] verify-otp succeeded but response missing token or user');
            setErrorMsg('Verification failed. Please try again.');
            return false;

        } catch (err: any) {
            setIsError(true);
            const backendMsg =
                typeof err.response?.data === 'string'
                    ? err.response.data
                    : err.response?.data?.message || err.response?.data?.error;
            setErrorMsg(backendMsg || 'Invalid, expired, or already used code.');
            console.log('[OTP] verification error:', backendMsg);
            return false;
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || isSendingOtp) return;

        setIsSendingOtp(true);
        setErrorMsg('');
        try {
            await api.post('/auth/resend-otp', { email });
            setCountdown(60);
            setOtp('');
            setIsError(false);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Failed to resend OTP. Please try again later.'
            );
        } finally {
            setIsSendingOtp(false);
        }
    };

    if (!email) return null;

    const [localPart, domain] = email.split('@');
    const maskedEmail =
        localPart.length > 2
            ? `${localPart.substring(0, 2)}***@${domain}`
            : `***@${domain}`;

    return (
        <div className="w-full max-w-md flex flex-col items-center justify-center relative z-10 px-4 sm:px-0">
            <div className="w-full glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">

                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center mb-4 shadow-[0_0_15px_var(--glow-purple)]">
                    <ShieldCheck className="w-6 h-6" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 text-center">
                    Verify your email
                </h2>
                <p className="text-white/60 text-xs sm:text-sm text-center max-w-[280px] mb-8">
                    {isSendingOtp ? (
                        'Sending your code...'
                    ) : (
                        <>
                            Enter the 6-digit code we sent to{' '}
                            <span className="text-white font-medium">{maskedEmail}</span>.
                        </>
                    )}
                </p>

                <div className="mb-8 w-full flex justify-center">
                    <OrbitalOtpInput
                        value={otp}
                        disabled={isVerifying}
                        onChange={(val) => {
                            setOtp(val);
                            if (isError) setIsError(false);
                            if (errorMsg) setErrorMsg('');
                        }}
                        onComplete={handleComplete}
                    />
                </div>

                {errorMsg && (
                    <div className="text-[var(--danger)] text-xs sm:text-sm mb-5 font-medium text-center w-full bg-[var(--danger)]/15 border border-[var(--danger)]/30 py-2.5 px-3 rounded-xl animate-in fade-in">
                        {errorMsg}
                    </div>
                )}

                <div className="text-xs sm:text-sm text-center w-full pt-2 border-t border-white/10">
                    {countdown > 0 ? (
                        <span className="text-white/50">
                            Didn't receive the code? Resend in{' '}
                            <span className="text-white font-medium">{countdown}s</span>
                        </span>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={isSendingOtp}
                            className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors inline-flex items-center space-x-1"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 mr-1 ${isSendingOtp ? 'animate-spin' : ''}`}
                            />
                            <span>Resend code</span>
                        </button>
                    )}
                </div>
            </div>

            <p className="text-center text-white/40 text-xs mt-6 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Check your spam folder if the code doesn't arrive within 1 minute.</span>
            </p>
        </div>
    );
};

export default OtpVerification;
