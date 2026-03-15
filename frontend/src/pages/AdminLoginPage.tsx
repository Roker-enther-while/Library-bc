import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, BookOpen, Shield, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { Page } from '../types';
import { loginAdmin } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AdminLoginPageProps {
  onNavigate?: (page: Page, data?: any) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = () => {
  const navigate = useNavigate();
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
      const { token, user } = await loginAdmin(username, password);
      if (user.role !== 'admin' && user.role !== 'librarian') {
        setError('Bạn không có quyền truy cập vào khu vực này!');
        setLoading(false);
        return;
      }

      // Clear any existing guest session
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
      navigate('/admin');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại!';
      setError(msg);
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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C5973E, transparent)' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #A52422, transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #2D6A4F, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #C5973E 0, #C5973E 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A52422, #C5973E)' }}>
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
              Thư Viện Văn Học
            </span>
          </div>
          <p className="text-white/40 text-sm font-sans ml-13">Việt Nam</p>
        </div>

        <div className="relative z-10 text-center">
          <div className="w-32 h-32 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #A52422 0%, #C5973E 100%)' }}>
            <Shield size={56} className="text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hệ Thống<br />
            <span style={{ color: '#C5973E' }}>Quản Lý Thư Viện</span>
          </h1>
          <p className="text-white/60 text-base font-sans leading-relaxed max-w-sm mx-auto">
            Nền tảng quản lý sách văn học Việt Nam — Theo dõi mượn trả, quản lý kho sách và tài khoản một cách dễ dàng.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['📚 Quản lý Sách', '👥 Thành viên', '🔄 Mượn / Trả', '📋 Nhật ký'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-sans font-medium text-white/70 border border-white/10 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-l-2 pl-4" style={{ borderColor: '#C5973E' }}>
          <p className="text-white/60 italic text-sm font-serif leading-relaxed">
            "Sách là ngọn đèn sáng bất diệt của trí tuệ con người."
          </p>
          <p className="text-white/30 text-xs font-sans mt-1">— Thư viện Văn học Việt Nam</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors mb-8 text-sm font-sans group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Về trang chủ thư viện
          </button>

          <div className="rounded-3xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <div className="px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A52422, #C5973E)' }}>
                  <Lock size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Đăng nhập quản lý</h2>
                  <p className="text-white/50 text-xs font-sans">Dành cho Admin & Thủ thư</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-5 border" style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-sans">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 font-sans uppercase tracking-wider">
                    Tên đăng nhập
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-gray-50 ${focusedField === 'username' ? 'border-blue-500 bg-white shadow-sm shadow-blue-100' : 'border-gray-200'
                    }`}>
                    <User size={18} className={focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'} />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập tên đăng nhập..."
                      className="flex-1 bg-transparent text-gray-900 text-sm font-sans outline-none placeholder:text-gray-400"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 font-sans uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-gray-50 ${focusedField === 'password' ? 'border-blue-500 bg-white shadow-sm shadow-blue-100' : 'border-gray-200'
                    }`}>
                    <Lock size={18} className={focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập mật khẩu..."
                      className="flex-1 bg-transparent text-gray-900 text-sm font-sans outline-none placeholder:text-gray-400"
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-sans font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: loading ? '#64748b' : 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} className="text-amber-500" />
                  <p className="text-xs text-gray-500 font-sans font-medium">Tài khoản demo</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => quickLogin('admin', 'admin123')}
                    className="flex flex-col items-start p-3 rounded-xl border-2 border-dashed border-red-100 hover:border-red-300 hover:bg-red-50 transition-all group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">👑</span>
                      <span className="text-xs font-bold text-gray-700 font-sans group-hover:text-red-700">Admin</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 font-mono">admin / admin123</p>
                      <p className="text-[10px] text-gray-400 font-sans">Toàn quyền hệ thống</p>
                    </div>
                  </button>
                  <button
                    onClick={() => quickLogin('librarian', 'lib123')}
                    className="flex flex-col items-start p-3 rounded-xl border-2 border-dashed border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">📚</span>
                      <span className="text-xs font-bold text-gray-700 font-sans group-hover:text-blue-700">Thủ thư</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 font-mono">librarian / lib123</p>
                      <p className="text-[10px] text-gray-400 font-sans">Quản lý sách & mượn</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-xs text-green-800 font-sans">
                  <span className="font-bold">Lưu ý phân quyền:</span> Admin có thể quản lý tài khoản hệ thống. Thủ thư chỉ quản lý sách, thành viên và mượn/trả.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs font-sans mt-6">
            © 2025 Thư Viện Văn Học Việt Nam · Hệ thống quản lý nội bộ
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
