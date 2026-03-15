import React, { useState } from 'react';
import { X, BookOpen, MapPin, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { createReservation } from '../services/api';

interface ReservationModalProps {
    book: {
        id?: string; _id?: string;
        title: string; authorName?: string; coverImage?: string;
        shelfLocation?: string; availableCopies?: number; available?: number;
    };
    onClose: () => void;
    onSuccess?: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ book, onClose, onSuccess }) => {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'success' | 'error'>('form');
    const [errorMsg, setErrorMsg] = useState('');

    const bookId = book._id || book.id || '';
    const available = book.availableCopies ?? book.available ?? 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        if (!token) {
            setErrorMsg('Bạn cần đăng nhập để đặt trước sách.');
            setStep('error');
            return;
        }
        setLoading(true);
        try {
            await createReservation(bookId, note);
            setStep('success');
            onSuccess?.();
        } catch (err: any) {
            console.error('Reservation error:', err);
            const msg = err?.response?.data?.message || 'Không thể gửi yêu cầu đặt trước. Vui lòng kiểm tra kết nối mạng và thử lại.';
            setErrorMsg(msg);
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#065f46 100%)' }}>
                    <div className="px-6 pt-8 pb-6">
                        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-white/10">
                                {book.coverImage
                                    ? <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={24} className="text-white/60" /></div>
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Đặt trước sách</p>
                                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{book.title}</h3>
                                {book.authorName && <p className="text-white/60 text-sm mt-0.5">{book.authorName}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Status pills */}
                    <div className="flex gap-2 px-6 pb-5">
                        {book.shelfLocation && (
                            <span className="flex items-center gap-1 bg-white/10 text-white/80 text-[11px] px-2.5 py-1 rounded-full font-medium">
                                <MapPin size={11} /> {book.shelfLocation}
                            </span>
                        )}
                        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold ${available > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${available > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {available > 0 ? `Còn ${available} bản` : 'Hết sách'}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 'form' && (
                        <form onSubmit={handleSubmit}>
                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Clock size={14} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-blue-800 text-sm font-semibold mb-0.5">Quy trình đặt trước</p>
                                    <p className="text-blue-600 text-xs leading-relaxed">
                                        Thư viện sẽ xem xét và xác nhận trong <strong>1–2 ngày làm việc</strong>. Sau khi xác nhận, bạn sẽ nhận email thông báo kèm thời hạn đến nhận sách.
                                    </p>
                                </div>
                            </div>

                            {/* Note input */}
                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Ghi chú (không bắt buộc)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Ví dụ: Tôi cần sách trong tuần này, hoặc tôi đang cần bản dày..."
                                    rows={3}
                                    maxLength={300}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                />
                                <p className="text-right text-xs text-gray-400 mt-1">{note.length}/300</p>
                            </div>

                            {/* Steps preview */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    { icon: '📝', label: 'Gửi yêu cầu' },
                                    { icon: '✅', label: 'Xác nhận qua email' },
                                    { icon: '📚', label: 'Đến nhận sách' },
                                ].map((s, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl text-center">
                                        <span className="text-lg">{s.icon}</span>
                                        <p className="text-[11px] font-medium text-gray-600 leading-tight">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang gửi...</>
                                ) : (
                                    <>Gửi yêu cầu đặt trước <ChevronRight size={16} /></>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Đặt trước thành công! 🎉</h4>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Yêu cầu của bạn đã được ghi nhận. Thư viện sẽ xem xét và gửi email xác nhận trong <strong>1–2 ngày làm việc</strong>.
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6 text-left">
                                <p className="text-amber-800 text-xs font-semibold mb-1">📬 Kiểm tra hộp thư của bạn</p>
                                <p className="text-amber-700 text-xs">Email xác nhận kèm hướng dẫn nhận sách sẽ được gửi sau khi thư viện duyệt.</p>
                            </div>
                            <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors">
                                Đóng
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Có lỗi xảy ra</h4>
                            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setStep('form')} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                                    Thử lại
                                </button>
                                <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationModal;
