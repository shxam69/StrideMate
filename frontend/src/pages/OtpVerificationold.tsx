import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OrbitalOtpInput from '../components/auth/OrbitalOtpInput';
import api from '../services/api';

const OtpVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(24);
    
    const location = useLocation();
    const navigate = useNavigate();
    const phoneNumber = location.state?.phoneNumber;

    useEffect(() => {
        if (!phoneNumber) {
            navigate('/register');
        }
    }, [phoneNumber, navigate]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleComplete = async (code: string): Promise<boolean> => {
        setIsError(false);
        setErrorMsg('');
        try {
            await api.post('/auth/verify-otp', { phoneNumber, otp: code });
            
            // Wait a moment for animation to finish visually before redirecting
            setTimeout(() => {
                navigate('/dashboard');
            }, 1200);
            return true;

        } catch (err: any) {
            setIsError(true);
            setErrorMsg(err.response?.data?.message || 'Invalid verification code');
            // Child component will clear the OTP after failure animation
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
            setErrorMsg('Failed to resend OTP. Please try again later.');
        }
    };

    if (!phoneNumber) return null;

    // Mask phone number logic
    const maskedPhone = phoneNumber.substring(0, 4) + ' •••• ' + phoneNumber.substring(phoneNumber.length - 4);

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="glass-card py-12 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center">
                    
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-3 text-center">Verify your number</h2>
                    <p className="text-slate-400 text-sm text-center max-w-[280px] mb-10">
                        Enter the 4-digit code we sent to <span className="text-white font-medium">{maskedPhone}</span>.
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
                        <p className="text-rose-400 text-sm mb-4 font-medium text-center w-full bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">{errorMsg}</p>
                    )}

                    <div className="text-sm text-center w-full">
                        {countdown > 0 ? (
                            <span className="text-slate-500">Didn't receive the code? Resend in <span className="text-slate-300 font-medium">{countdown}s</span></span>
                        ) : (
                            <button 
                                onClick={handleResend}
                                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                            >
                                Resend code
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-center text-slate-500 text-xs mt-8">
                    Type it, paste it, or let the message fill it.
                </p>
            </div>
        </div>
    );
};

export default OtpVerification;
