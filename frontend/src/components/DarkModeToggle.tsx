'use client';

import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Read from localStorage on mount (client-only)
        const stored = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = stored === 'true' || (!stored && prefersDark);
        setIsDark(dark);
        if (dark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', String(next));
    };

    return (
        <button
            onClick={toggle}
            className="relative w-14 h-7 rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            style={{
                background: isDark
                    ? 'linear-gradient(to right, #1e1b4b, #4c1d95)'
                    : 'linear-gradient(to right, #38bdf8, #3b82f6)'
            }}
            aria-label={isDark ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
        >
            <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-pulse" />
                    <span className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <span className="absolute bottom-2 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="absolute top-1 right-2 w-2 h-1 bg-white/60 rounded-full" />
                    <span className="absolute bottom-1.5 right-4 w-3 h-1 bg-white/40 rounded-full" />
                </div>
            </div>
            <div
                className={`relative w-5 h-5 rounded-full transform transition-all duration-300 ${isDark ? 'translate-x-7 bg-gray-200' : 'translate-x-0 bg-yellow-300'
                    }`}
            >
                <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200 animate-pulse" />
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    <span className="absolute bottom-1.5 left-1 w-1 h-1 bg-gray-400 rounded-full" />
                </div>
            </div>
        </button>
    );
}
