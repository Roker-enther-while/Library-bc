'use client';
import { useEffect } from 'react';
import { initSecurityMonitoring } from '@/lib/security';

export default function SecurityMonitor() {
    useEffect(() => {
        initSecurityMonitoring();
    }, []);

    return null; // This component doesn't render anything
}
