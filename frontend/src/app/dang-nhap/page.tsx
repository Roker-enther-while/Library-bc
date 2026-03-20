'use client';

import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { login, register } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const AuthPage: React.FC = () => {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const data = await login({ username: form.username, password: form.password });
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            } else {
                const data = await register(form);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-dark-card rounded-3xl shadow-xl overflow-hidden animate-scaleIn">
                    <div className="bg-jade px-8 py-10 text-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-4 text-white">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Đăng nhập Độc giả' : 'Đăng ký Tài khoản'}
                        </h2>
                        <p className="text-white/80 font-sans text-sm">
                            {isLogin ? 'Tiếp tục hành trình khám phá văn học' : 'Tham gia cộng đồng yêu văn học'}
                        </p>
                    </div>
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-sans">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={form.fullName}
                                                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-sans focus:ring-2 focus:ring-jade/30 outline-none"
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-sans focus:ring-2 focus:ring-jade/30 outline-none"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={form.username}
                                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-sans focus:ring-2 focus:ring-jade/30 outline-none"
                                        placeholder="Tên đăng nhập"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-sans focus:ring-2 focus:ring-jade/30 outline-none"
                                        placeholder="........"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-jade text-white rounded-xl font-sans font-semibold hover:bg-jade-dark transition-all shadow-lg disabled:opacity-70"
                            >
                                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm font-sans text-jade hover:text-jade-dark font-medium transition-colors"
                            >
                                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
