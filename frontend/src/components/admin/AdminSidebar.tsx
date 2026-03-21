'use client';

import React from 'react';
import {
    LayoutDashboard, Library, Users, ClipboardList, Newspaper,
    BookMarked, UserCog, Activity, Globe, LogOut
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    always: boolean;
    badge: number;
}

interface AdminSidebarProps {
    sidebarCollapsed: boolean;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    navItems: NavItem[];
    onLogout: () => void;
    onGoHome: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
    sidebarCollapsed, activeTab, setActiveTab, navItems, onLogout, onGoHome
}) => {
    return (
        <aside className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[70px]' : 'w-[240px]'}`}
            style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 50%, #0F3460 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.3)' }}>
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${sidebarCollapsed ? 'justify-center px-3' : ''}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #A52422 0%, #C5973E 100%)' }}>
                    <BookMarked size={17} className="text-white" />
                </div>
                {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="text-white font-bold text-[13px] leading-tight tracking-wide">Thư Viện</p><p className="text-white/40 text-[10px] uppercase tracking-widest">Văn Học Việt Nam</p></div>}
            </div>
            <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${activeTab === item.id ? 'text-white' : 'text-white/50 hover:text-white/90 hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center' : ''}`} style={activeTab === item.id ? { background: `linear-gradient(135deg, ${item.color}30, ${item.color}50)` } : {}}>
                        <span className="flex-shrink-0" style={activeTab === item.id ? { color: item.color } : {}}>{item.icon}</span>
                        {!sidebarCollapsed && <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>}
                        {item.badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center animate-pulse">{item.badge}</span>}
                    </button>
                ))}
            </nav>
            <div className="p-2.5 border-t border-white/10 space-y-0.5">
                <button onClick={onGoHome} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/80 transition-all text-sm"><Globe size={17} />{!sidebarCollapsed && <span className="text-[13px]">Về trang chủ</span>}</button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm"><LogOut size={17} />{!sidebarCollapsed && <span className="text-[13px]">Đăng xuất</span>}</button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
