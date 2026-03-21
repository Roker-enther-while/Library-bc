'use client';

import React from 'react';
import { Menu, Bell, X, User, LogOut, ChevronDown } from 'lucide-react';
import { AdminUser } from '@/types';

interface AdminHeaderProps {
    user: AdminUser;
    activeTabLabel: string;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean) => void;
    showNotifications: boolean;
    setShowNotifications: (v: boolean) => void;
    showProfileMenu: boolean;
    setShowProfileMenu: (v: boolean) => void;
    borrows: any[];
    reservations: any[];
    overdueBorrows: number;
    handleLogout: () => void;
    setActiveTab: (v: any) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    user, activeTabLabel, sidebarCollapsed, setSidebarCollapsed,
    showNotifications, setShowNotifications,
    showProfileMenu, setShowProfileMenu,
    borrows, reservations, overdueBorrows,
    handleLogout, setActiveTab
}) => {
    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <Menu size={18} />
                </button>
                <h1 className="text-sm font-bold text-gray-900">{activeTabLabel}</h1>
            </div>
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative">
                    <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                        className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                        <Bell size={18} />
                        {overdueBorrows > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn origin-top-right">
                            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">Thông báo mới</span>
                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                <div className="p-2 space-y-1">
                                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Hoạt động mượn sách</p>
                                    {borrows.slice(0, 3).map(b => (
                                        <div key={b.id || b._id} className="p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => { setActiveTab('borrows'); setShowNotifications(false); }}>
                                            <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{b.borrowerName} mượn "{b.bookTitle}"</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Hạn trả: {new Date(b.dueDate).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    ))}

                                    <div className="h-px bg-gray-50 my-2" />

                                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Quy trình mượn sách</p>
                                    {reservations.filter(r => r.status === 'pending').map(r => (
                                        <div key={`notif-res-${r._id || r.id}`} className="p-3 bg-blue-50/30 rounded-xl border border-blue-100 flex items-start gap-3" onClick={() => { setActiveTab('reservations'); setShowNotifications(false); }}>
                                            <div>
                                                <p className="text-[13px] font-semibold text-gray-800">Yêu cầu đặt chỗ mới</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Từ: {r.user?.fullName || 'Độc giả'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {reservations.filter(r => r.status === 'pending').length === 0 && (
                                        <p className="px-3 py-4 text-center text-[12px] text-gray-400 italic">Không có quy trình nào cần xử lý</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => { setActiveTab('activities'); setShowNotifications(false); }} className="w-full py-3 text-center text-[12px] font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-50">Xem tất cả hoạt động</button>
                        </div>
                    )}
                </div>

                {/* Profile Menu */}
                <div className="relative">
                    <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                        className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all ${showProfileMenu ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-[13px] font-bold text-gray-900 leading-none mb-0.5">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'}</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn origin-top-right">
                            <div className="p-2 space-y-1">
                                {user?.role === 'admin' && (
                                    <button onClick={() => { setActiveTab('accounts'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><User size={16} /></div>
                                        Hồ sơ & Tài khoản
                                    </button>
                                )}
                                <div className="h-px bg-gray-50 my-1 mx-2" />
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><LogOut size={16} /></div>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
