'use client';

import { useState, useEffect } from 'react';
import {
    getMe,
    getUserHistory,
    getMyReservations,
    getNotifications,
    markNotificationRead,
    cancelReservation,
    renewBook
} from '@/lib/apiClient';
import {
    User as UserIcon,
    BookOpen,
    Heart,
    Clock,
    Award,
    Bell,
    Calendar,
    AlertCircle,
    CheckCircle,
    Info,
    XCircle,
    RotateCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useService } from '@/contexts/ServiceProvider';

const ProfilePageContent: React.FC = () => {
    const router = useRouter();
    const service = useService();
    const [user, setUser] = useState<any>(null);
    const [borrows, setBorrows] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'borrows' | 'reservations' | 'notifications'>('overview');

    const fetchData = async () => {
        try {
            setLoading(true);
            const userData = await getMe();
            setUser(userData);

            const [borrowData, reserveData, notifyData] = await Promise.all([
                getUserHistory(userData.id),
                getMyReservations(),
                getNotifications()
            ]);

            setBorrows(borrowData);
            setReservations(reserveData);
            setNotifications(notifyData);
        } catch (error) {
            console.error("Error fetching profile dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReadNotification = async (id: string) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelReservation = async (id: string) => {
        if (!confirm('Bạn có chắc muốn hủy yêu cầu đặt trước này?')) return;
        try {
            await cancelReservation(id, 'Độc giả tự hủy');
            setReservations(reservations.filter(r => r._id !== id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenew = async (recordId: string) => {
        try {
            await renewBook(recordId);
            fetchData();
            alert('Gia hạn thành công!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể gia hạn');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4 bg-parchment dark:bg-dark-bg min-h-screen">
                <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                <p className="text-ink-light font-display italic">Đang tải dữ liệu thư viện...</p>
            </div>
        );
    }

    const activeBorrowsCount = borrows.filter(b => b.status === 'borrowing' || b.status === 'overdue').length;

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg py-8 transition-colors">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header Card */}
                <div className="bg-white dark:bg-dark-card rounded-2xl p-6 md:p-8 mb-8 shadow-lg border-l-8 border-gold">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-vermillion flex items-center justify-center text-white shadow-lg shrink-0">
                            <UserIcon size={40} />
                        </div>
                        <div className="text-center md:text-left flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-display font-bold text-ink dark:text-parchment mb-1 truncate">
                                {user?.fullName || 'Độc giả Thư viện'}
                            </h1>
                            <p className="text-ink-light dark:text-gray-400 mb-3 font-display italic">
                                Mã thẻ: {user?.studentId || 'N/A'} • {user?.email}
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user?.cardStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {user?.cardStatus === 'active' ? '🟢 Thẻ Đang Hoạt Động' : '🔴 Thẻ Bị Khóa'}
                                </span>
                                <span className="px-3 py-1 bg-gold/10 text-gold-dark rounded-full text-xs font-semibold">
                                    💰 Tiền phạt: {user?.penalties?.toLocaleString()} VNĐ
                                </span>
                                <span className="px-3 py-1 bg-vermillion/10 text-vermillion rounded-full text-xs font-semibold">
                                    📚 Hạn mức: {activeBorrowsCount}/{user?.maxBorrowLimit || 5} cuốn
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs Navigation */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Tổng quan', icon: <Award size={18} /> },
                        { id: 'borrows', label: 'Sách đang mượn', icon: <BookOpen size={18} />, count: activeBorrowsCount },
                        { id: 'reservations', label: 'Đặt trước', icon: <Clock size={18} />, count: reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').length },
                        { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} />, count: notifications.filter(n => !n.isRead).length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold transition-all shrink-0 shadow-sm ${activeTab === tab.id
                                    ? 'bg-ink text-parchment dark:bg-gold dark:text-ink shadow-md translate-y-[-2px]'
                                    : 'bg-white dark:bg-dark-card text-ink-light dark:text-gray-400 hover:bg-parchment-dark'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-vermillion text-white text-[10px] rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-xl min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
                            <div>
                                <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                                    <Award className="text-gold" /> Thành tựu Độc giả
                                </h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-parchment/50 dark:bg-dark-surface rounded-xl border border-gold/20">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-medium">Tiến trình hạng thẻ</span>
                                            <span className="text-xs text-ink-light">Hạng: {activeBorrowsCount > 10 ? 'Bạc' : 'Đồng'}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${Math.min(activeBorrowsCount * 10, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    {/* Favorites (existing functionality preserved via state if we added it back, or just showing count) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-vermillion/5 rounded-xl border border-vermillion/10">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mượn thành công</p>
                                            <p className="text-2xl font-bold text-vermillion">{borrows.length}</p>
                                        </div>
                                        <div className="p-4 bg-sky/5 rounded-xl border border-sky/10">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lượt đặt trước</p>
                                            <p className="text-2xl font-bold text-sky">{reservations.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                                    <Calendar className="text-sky" /> Thông báo mới nhất
                                </h2>
                                <div className="space-y-3">
                                    {notifications.slice(0, 3).map(n => (
                                        <div key={n._id} className={`p-3 rounded-lg border-l-4 ${n.isRead ? 'bg-gray-50 border-gray-300 opacity-60' : 'bg-sky/5 border-sky'}`}>
                                            <p className="text-xs font-bold text-ink dark:text-parchment">{n.title}</p>
                                            <p className="text-[11px] text-ink-light truncate">{n.message}</p>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && <p className="text-center py-8 text-gray-400 italic">Không có thông báo mới</p>}
                                    <button onClick={() => setActiveTab('notifications')} className="w-full py-2 text-xs font-bold text-sky hover:underline">Xem tất cả thông báo</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'borrows' && (
                        <div className="space-y-4 animate-pageSlideIn">
                            <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4">Sách đang lưu giữ</h2>
                            {borrows.filter(b => b.status === 'borrowing' || b.status === 'overdue').length > 0 ? (
                                <div className="grid gap-4">
                                    {borrows.filter(b => b.status === 'borrowing' || b.status === 'overdue').map(record => (
                                        <div key={record._id} className="flex items-center gap-4 p-4 bg-parchment/30 dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <img src={(record.book as any).coverImage} className="w-16 h-20 object-cover rounded-lg shadow-md" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-ink dark:text-parchment truncate">{(record.book as any).title}</h3>
                                                <p className="text-xs text-ink-light italic">Ngày trả dự kiến: {new Date(record.dueDate).toLocaleDateString('vi-VN')}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    {record.status === 'overdue' && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">🔥 Quá hạn</span>}
                                                    <span className="text-[10px] bg-sky/10 text-sky px-2 py-0.5 rounded-full font-bold">Lần gia hạn: {record.renewCount || 0}/2</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    disabled={(record.renewCount || 0) >= 2}
                                                    onClick={() => handleRenew(record._id)}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-ink dark:bg-parchment dark:text-ink text-parchment text-xs font-bold rounded-lg hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <RotateCcw size={14} /> Gia hạn
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-display italic">Bạn chưa mượn cuốn sách nào.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reservations' && (
                        <div className="space-y-4 animate-pageSlideIn">
                            <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4">Yêu cầu Đặt trước</h2>
                            {reservations.length > 0 ? (
                                <div className="grid gap-4">
                                    {reservations.map(res => (
                                        <div key={res._id} className="flex items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <img src={(res.book as any).coverImage} className="w-16 h-20 object-cover rounded-lg" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-ink dark:text-parchment truncate">{(res.book as any).title}</h3>
                                                <p className="text-xs text-ink-light">Ngày tạo: {new Date(res.createdAt).toLocaleDateString('vi-VN')}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                            res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {res.status === 'pending' ? '⏳ Đang chờ' :
                                                            res.status === 'confirmed' ? '✅ Có thể nhận' :
                                                                res.status === 'picked_up' ? '📦 Đã nhận' : '❌ Đã hủy'}
                                                    </span>
                                                    {res.pickupDeadline && (
                                                        <span className="text-[10px] text-emerald-600 font-bold">Hạn nhận: {new Date(res.pickupDeadline).toLocaleDateString('vi-VN')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {res.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancelReservation(res._id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-display italic">Không có yêu cầu đặt trước nào.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-2 animate-pageSlideIn">
                            <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4">Thông báo từ Thư viện</h2>
                            {notifications.length > 0 ? (
                                <div className="space-y-3">
                                    {notifications.map(n => (
                                        <div
                                            key={n._id}
                                            onClick={() => !n.isRead && handleReadNotification(n._id)}
                                            className={`flex gap-4 p-4 rounded-xl border-l-4 cursor-pointer transition-all ${n.isRead ? 'bg-gray-50 border-gray-300 opacity-60' : 'bg-white shadow-md border-sky hover:shadow-lg'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'alert' ? 'bg-rose-100 text-rose-600' :
                                                    n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                        n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-sky-100 text-sky-600'
                                                }`}>
                                                {n.type === 'alert' ? <AlertCircle size={20} /> :
                                                    n.type === 'warning' ? <Info size={20} /> :
                                                        n.type === 'success' ? <CheckCircle size={20} /> :
                                                            <Bell size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-ink dark:text-parchment">{n.title}</h4>
                                                    <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <p className="text-xs text-ink-light dark:text-gray-400 leading-relaxed">{n.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-display italic">Hộp thư vắng lặng.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePageContent;
