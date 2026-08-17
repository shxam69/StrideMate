import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AuthBackground from '../components/auth/AuthBackground';

const AuthLayout: React.FC = () => {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <div
  data-theme="dark"
  className="auth-page relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[var(--bg)]"
>
            {/* Base Background: WebGL Threads (Persistent) */}
            <div className="absolute inset-0 z-0 pointer-events-auto">
                <AuthBackground />
            </div>

            {/* Atmospheric Overlay */}
            <div className="auth-atmosphere absolute inset-0 z-10 pointer-events-none"></div>

            {/* Auth Content Area (Animated) */}
            <div className="relative z-20 w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-6xl pointer-events-auto flex justify-center"
                    >
                        {outlet && React.cloneElement(outlet as React.ReactElement, { key: location.pathname })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthLayout;
