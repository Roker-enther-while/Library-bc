'use client';

import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, BookOpen, Shield, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { loginAdmin } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const AdminLoginPageContent: React.FC = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginAdmin(username, password);
            const user = data.user;
            if (user.role !== 'admin') {
                setError('Cổng này chỉ dành riêng cho Quản trị viên hệ thống!');
                setLoading(false);
                return;
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Store admin credentials in sessionStorage for tab-isolation
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminUser', JSON.stringify(user));
            router.push('/admin');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (uname: string, pwd: string) => {
        setUsername(uname);
        setPassword(pwd);
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 40%, #0F3460 100%)' }}>
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-vermillion to-gold">
                            <BookOpen size={20} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-xl tracking-wide font-display">Thư Viện Văn Học</span>
                    </div>
                    <p className="text-white/40 text-sm font-sans ml-13">Việt Nam</p>
                </div>

                <div className="relative z-10 text-center">
                    <div className="w-32 h-32 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl bg-gradient-to-br from-vermillion to-gold">
                        <Shield size={56} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight font-display">Hệ Thống<br /><span className="text-gold">Quản Lý Thư Viện</span></h1>
                    <p className="text-white/60 text-base font-sans leading-relaxed max-w-sm mx-auto">Nền tảng quản lý sách văn học Việt Nam.</p>
                </div>

                <div className="relative z-10 border-l-2 pl-4 border-gold">
                    <p className="text-white/60 italic text-sm font-serif">"Sách là ngọn đèn sáng bất diệt của trí tuệ con người."</p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors mb-8 text-sm font-sans group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Về trang chủ thư viện
                    </button>

                    <div className="rounded-3xl shadow-2xl overflow-hidden bg-white/95">
                        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
                            <h2 className="text-white font-bold text-lg">Đăng nhập quản lý</h2>
                            <p className="text-white/50 text-xs">Dành cho Admin & Thủ thư</p>
                        </div>

                        <div className="p-8">
                            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-600">{error}</div>}
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Tên đăng nhập</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Mật khẩu</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none transition-all"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] shadow-lg disabled:opacity-70"
                                >
                                    {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <p className="text-xs text-gray-500 font-medium mb-3">Tài khoản demo</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => quickLogin('admin', 'admin123')} className="p-3 rounded-xl border-2 border-dashed border-red-100 hover:bg-red-50 text-left">
                                        <span className="text-xs font-bold block">Admin</span>
                                        <span className="text-[10px] text-gray-500 font-mono">admin / admin123</span>
                                    </button>
                                    <button onClick={() => quickLogin('quanly', 'quanly123')} className="p-3 rounded-xl border-2 border-dashed border-blue-100 hover:bg-blue-50 text-left">
                                        <span className="text-xs font-bold block">Thủ thư</span>
                                        <span className="text-[10px] text-gray-500 font-mono">quanly / quanly123</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPageContent;
