import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrbitalOtpInput from '../components/auth/OrbitalOtpInput';
import api from '../services/api';

const OtpVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const hasRequestedRef = useRef(false);

    const location = useLocation();
    const navigate = useNavigate();
    const phoneNumber = location.state?.phoneNumber;
    // Register.tsx (confirmed) does not call request-otp itself, so this
    // screen is the sole trigger for OTP generation. The otpRequested flag
    // is kept as an escape hatch only — if Register.tsx is ever changed to
    // request the OTP before navigating, set state: { otpRequested: true }
    // there and this effect will skip the duplicate call.
    const alreadyRequested = Boolean(location.state?.otpRequested);

    useEffect(() => {
        if (!phoneNumber) {
            navigate('/register');
        }
    }, [phoneNumber, navigate]);

    // Auto-request the OTP the moment this screen is reached, unless the
    // caller already triggered it. This is what makes OTP generation
    // "automatic after registration" without Register.tsx needing to know
    // anything about the OTP endpoint.
    useEffect(() => {
        if (!phoneNumber || hasRequestedRef.current) return;

        if (alreadyRequested) {
            setCountdown(24);
            return;
        }

        hasRequestedRef.current = true;
        sendOtp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phoneNumber]);

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
            await api.post('/auth/request-otp', { phoneNumber });
            setCountdown(24);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to send verification code. Please try again.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleComplete = async (code: string): Promise<boolean> => {
        setIsError(false);
        setErrorMsg('');
        try {
            await api.post('/auth/verify-otp', { phoneNumber, otp: code });

            // Let the checkmark/convergence animation finish playing before
            // navigating away.
            setTimeout(() => {
                navigate('/dashboard');
            }, 1200);
            return true;

        } catch (err: any) {
            setIsError(true);
            // verifyOtp returns its failure reason as a plain string body
            // (e.g. "Invalid, expired, or already used OTP"), not {message},
            // so check both shapes rather than assuming JSON.
            const backendMsg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message;
            setErrorMsg(backendMsg || 'Invalid or expired code');
            // OrbitalOtpInput clears the value and resets to "entering"
            // after playing the error/shake state.
            return false;
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        try {
            await api.post('/auth/resend-otp', { phoneNumber });
            setCountdown(24);
            setOtp('');
            setIsError(false);
            setErrorMsg('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to resend OTP. Please try again later.');
        }
    };

    if (!phoneNumber) return null;

    const maskedPhone = phoneNumber.substring(0, 4) + ' •••• ' + phoneNumber.substring(phoneNumber.length - 4);

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="glass-card py-12 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center">

                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] mb-3 text-center">Verify your number</h2>
                    <p className="text-[var(--text-muted)] text-sm text-center max-w-[280px] mb-10">
                        {isSendingOtp ? (
                            'Sending your code...'
                        ) : (
                            <>Enter the 4-digit code we sent to <span className="text-[var(--text)] font-medium">{maskedPhone}</span>.</>
                        )}
                    </p>

                    <div className="mb-12 w-full flex justify-center">
                        <OrbitalOtpInput
                            value={otp}
                            onChange={(val) => {
                                setOtp(val);
                                if (isError) setIsError(false);
                            }}
                            onComplete={handleComplete}
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-[var(--danger)] text-sm mb-4 font-medium text-center w-full bg-[var(--danger)]/10 border border-[var(--danger)]/20 py-2 rounded-lg">{errorMsg}</p>
                    )}

                    <div className="text-sm text-center w-full">
                        {countdown > 0 ? (
                            <span className="text-[var(--text-muted)]">Didn't receive the code? Resend in <span className="text-[var(--text)] font-medium">{countdown}s</span></span>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                            >
                                Resend code
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-center text-[var(--text-muted)] text-xs mt-8">
                    Type it, paste it, or let the message fill it.
                </p>
            </div>
        </div>
    );
};

export default OtpVerification;
