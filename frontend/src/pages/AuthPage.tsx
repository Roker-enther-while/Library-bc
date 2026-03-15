import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Page } from '../types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
    onNavigate?: (page: Page, data?: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin
                ? { username: form.username, password: form.password }
                : { username: form.username, password: form.password, fullName: form.fullName, email: form.email };
            const response = await axios.post(`http://localhost:5000${endpoint}`, payload);

            // Clear any existing admin session
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-scaleIn">
                    <div className="bg-jade px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
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
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-sm font-sans animate-fadeIn">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="block text-xs font-sans font-semibold text-gray-700 mb-1 ml-1">Họ và tên</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={form.fullName}
                                                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:bg-white focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-sans font-semibold text-gray-700 mb-1 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:bg-white focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-sans font-semibold text-gray-700 mb-1 ml-1">Tên đăng nhập</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={form.username}
                                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:bg-white focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
                                        placeholder="Tên đăng nhập"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-sans font-semibold text-gray-700 mb-1 ml-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:bg-white focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
                                        placeholder="........"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-jade text-white rounded-xl font-sans font-semibold hover:bg-jade-dark hover:-translate-y-0.5 transition-all shadow-lg shadow-jade/30 disabled:opacity-70 disabled:hover:translate-y-0"
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
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <button
                                onClick={() => navigate('/')}
                                className="text-xs font-sans text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Trở về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
