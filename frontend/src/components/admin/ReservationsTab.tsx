'use client';
import React from 'react';
import { BookOpen, Check, X, Package } from 'lucide-react';
import { StatusBadge } from './AdminUIHelper';

const fmtDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface ReservationsTabProps {
    reservations: any[];
    reservationFilter: string;
    setReservationFilter: (f: string) => void;
    onConfirm: (r: any) => void;
    onCancel: (r: any) => void;
    onPickedUp: (r: any) => void;
}

const ReservationsTab: React.FC<ReservationsTabProps> = ({
    reservations, reservationFilter, setReservationFilter, onConfirm, onCancel, onPickedUp
}) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
            {[
                { v: '', l: 'Tất cả' },
                { v: 'pending', l: '⏳ Chờ duyệt' },
                { v: 'confirmed', l: '✅ Đã xác nhận' },
                { v: 'picked_up', l: '📚 Đã nhận' },
                { v: 'cancelled', l: '❌ Đã hủy' },
                { v: 'expired', l: '⏰ Hết hạn' },
            ].map(f => (
                <button key={f.v} onClick={() => setReservationFilter(f.v)}
                    className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${reservationFilter === f.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {f.l}
                </button>
            ))}
        </div>

        <div className="space-y-3">
            {reservations.map((r: any) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-14 rounded-xl flex items-center justify-center bg-gray-100 flex-shrink-0">
                                {r.book?.coverImage
                                    ? <img src={r.book.coverImage} alt="" className="w-full h-full object-cover rounded-xl" />
                                    : <BookOpen size={16} className="text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <StatusBadge status={r.status} />
                                    {r.status === 'confirmed' && r.pickupDeadline && (
                                        <span className="text-[11px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                                            Hạn nhận: {fmtDate(r.pickupDeadline)}
                                        </span>
                                    )}
                                </div>
                                <p className="font-bold text-gray-900 text-[14px]">{r.book?.title || 'Không rõ'}</p>
                                <p className="text-[12px] text-gray-500 mt-0.5">{r.user?.fullName || 'Không rõ'} · {r.user?.phone || r.user?.email || ''}</p>
                                {r.note && <p className="text-[11px] text-blue-600 mt-1 italic">💬 {r.note}</p>}
                                <p className="text-[11px] text-gray-400 mt-1">Đặt ngày: {fmtDate(r.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                            {r.status === 'pending' && (
                                <>
                                    <button onClick={() => onConfirm(r)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                                        <Check size={12} /> Xác nhận
                                    </button>
                                    <button onClick={() => onCancel(r)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                                        <X size={12} /> Hủy
                                    </button>
                                </>
                            )}
                            {r.status === 'confirmed' && (
                                <button onClick={() => onPickedUp(r)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
                                    <Package size={12} /> Đã nhận sách
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {reservations.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
                    Không có đặt trước nào trong danh sách này.
                </div>
            )}
        </div>
    </div>
);

export default ReservationsTab;
