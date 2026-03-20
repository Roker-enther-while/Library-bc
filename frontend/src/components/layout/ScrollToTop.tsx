'use client';

import { useState, useEffect } from 'react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const toggleVisibility = () => {
            const scrolled = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;

            setScrollProgress(progress);
            setIsVisible(scrolled > 300);
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`scroll-to-top ${isVisible ? 'visible' : ''} group`}
            aria-label="Cuộn lên đầu trang"
        >
            <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`}
                        className="transition-all duration-100"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#C5973E" />
                            <stop offset="100%" stopColor="#A52422" />
                        </linearGradient>
                    </defs>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white dark:bg-dark-card rounded-full shadow-lg flex items-center justify-center group-hover:bg-gold group-hover:text-white transition-all duration-300">
                        <svg
                            className="w-5 h-5 text-gold group-hover:text-white transform group-hover:-translate-y-0.5 transition-all duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                </div>
            </div>
        </button>
    );
}
