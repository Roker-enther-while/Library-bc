'use client';

import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import BottomNavigation from './BottomNavigation';
import AIChatbot from './AIChatbot';
import { usePathname, useRouter } from 'next/navigation';
import useIdleTimeout from '@/hooks/useIdleTimeout';
import { useToast } from '@/components/ui/Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const { showToast } = useToast();

    const handleGlobalLogout = () => {
        const authKeys = ['user', 'adminUser', 'token', 'adminToken'];
        const isLogged = authKeys.some(key => !!localStorage.getItem(key));

        if (isLogged) {
            // Lưu lại chế độ tối trước khi xóa
            const isDark = localStorage.getItem('darkMode');

            localStorage.clear();

            // Khôi phục chế độ tối
            if (isDark) localStorage.setItem('darkMode', isDark);

            showToast('warning', 'Phiên làm việc đã hết hạn do bạn không hoạt động trong 10 phút. Vui lòng đăng nhập lại.', 5000);

            router.push('/');
        }
    };

    useIdleTimeout(handleGlobalLogout, 600000);

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        }
    }, []);

    const isAdminPage = pathname.startsWith('/admin');

    return (
        <div className="min-h-screen flex flex-col bg-parchment dark:bg-dark-bg transition-colors duration-300">
            {!isAdminPage && <Header />}
            <main className="flex-1">
                {children}
            </main>
            {!isAdminPage && <Footer />}
            <ScrollToTop />
            {!isAdminPage && <BottomNavigation />}
            {!isAdminPage && <AIChatbot />}
        </div>
    );
}
