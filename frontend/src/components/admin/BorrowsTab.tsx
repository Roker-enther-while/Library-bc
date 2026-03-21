'use client';
import React from 'react';
import { Mail, RefreshCw, Check, X, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';
import { BorrowRecord } from '@/types';
import { StatusBadge, Pagination } from './AdminUIHelper';

const fmtDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const daysLeft = (dueDate: string) => {
    if (!dueDate) return 0;
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) return 0;
    return Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
};

interface BorrowsTabProps {
    borrows: BorrowRecord[];
    borrowFilter: string;
    setBorrowFilter: (f: any) => void;
    setBorrowPage: (p: number) => void;
    paginatedBorrows: BorrowRecord[];
    borrowPage: number;
    totalBorrowPages: number;
    filteredBorrows: BorrowRecord[];
    PER_PAGE: number;
    onReturn: (b: BorrowRecord) => void;
    sendingReminders: boolean;
    onSendReminders: () => void;
    openBorrowModal: () => void;
}

const BorrowsTab: React.FC<BorrowsTabProps> = ({
    borrows, borrowFilter, setBorrowFilter, setBorrowPage,
    paginatedBorrows, borrowPage, totalBorrowPages, filteredBorrows,
    PER_PAGE, onReturn, sendingReminders, onSendReminders, openBorrowModal,
}) => (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            {[
                { v: 'all', l: 'Tất cả', c: borrows.length },
                { v: 'borrowing', l: '📖 Đang mượn', c: borrows.filter(b => b.status === 'borrowing').length },
                { v: 'overdue', l: '⚠️ Quá hạn', c: borrows.filter(b => b.status === 'overdue').length },
                { v: 'returned', l: '✅ Đã trả', c: borrows.filter(b => b.status === 'returned').length },
            ].map(f => (
                <button key={f.v} onClick={() => { setBorrowFilter(f.v); setBorrowPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${borrowFilter === f.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {f.l} <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${borrowFilter === f.v ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{f.c}</span>
                </button>
            ))}
            <div className="ml-auto flex gap-2">
                <button onClick={openBorrowModal} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm" style={{ background: 'linear-gradient(135deg,#3A7CA5,#2D6A4F)' }}>
                    + Tạo phiếu mượn
                </button>
                <button onClick={onSendReminders} disabled={sendingReminders} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border border-blue-300 text-blue-700 bg-white disabled:opacity-60">
                    {sendingReminders ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                    {sendingReminders ? 'Đang gửi...' : 'Gửi nhắc hạn'}
                </button>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sách</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Người mượn</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ngày mượn</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hạn trả</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedBorrows.map(b => {
                            const dl = daysLeft(b.dueDate);
                            const isOverdue = b.status === 'overdue' || (b.status === 'borrowing' && dl < 0);
                            return (
                                <tr key={b._id || b.id} className={`hover:bg-gray-50/70 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-gray-900 text-[13px] max-w-[180px] truncate">{b.bookTitle}</p>
                                        {isOverdue && <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-semibold mt-0.5"><AlertTriangle size={9} />{Math.abs(dl)} ngày quá hạn</span>}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="font-medium text-[13px] text-gray-800">{b.borrowerName}</p>
                                        <p className="text-[11px] text-gray-400">{b.borrowerPhone}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-gray-500 text-[13px]">{fmtDate(b.borrowDate)}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`text-[13px] font-semibold ${isOverdue ? 'text-red-600' : dl <= 3 ? 'text-amber-600' : 'text-gray-700'}`}>{fmtDate(b.dueDate)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center"><StatusBadge status={b.status} /></td>
                                    <td className="px-4 py-3.5 text-center">
                                        {(b.status === 'borrowing' || b.status === 'overdue') && (
                                            <button onClick={() => onReturn(b)}
                                                className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-xl text-[12px] font-bold text-white transition-all shadow-sm"
                                                style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)' }}>
                                                <Check size={12} /> Xác nhận trả
                                            </button>
                                        )}
                                        {b.status === 'returned' && <span className="text-[11px] text-gray-400 italic">Đã trả {b.returnDate ? fmtDate(b.returnDate) : ''}</span>}
                                    </td>
                                </tr>
                            );
                        })}
                        {paginatedBorrows.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">Không có phiếu mượn nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalBorrowPages > 1 && <Pagination current={borrowPage} total={totalBorrowPages} onChange={setBorrowPage} resultText={`${(borrowPage - 1) * PER_PAGE + 1}–${Math.min(borrowPage * PER_PAGE, filteredBorrows.length)} / ${filteredBorrows.length} phiếu`} />}
        </div>
    </div>
);

export default BorrowsTab;
