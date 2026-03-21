'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; headerColor?: string; size?: 'sm' | 'md' | 'lg' }> = ({ title, onClose, children, headerColor = '#1A1A2E', size = 'md' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleIn ${size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg'}`}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: headerColor }}>
                <h3 className="font-bold text-white text-[13px] uppercase tracking-wider">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <X size={16} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export const ModalFooter: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmColor?: string }> = ({ onCancel, onConfirm, confirmLabel, confirmColor = '#2D6A4F' }) => (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Hủy</button>
        <button onClick={onConfirm} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2" style={{ background: confirmColor }}>
            <Check size={16} /> {confirmLabel}
        </button>
    </div>
);

export const FormLabel: React.FC<{ required?: boolean; children: React.ReactNode }> = ({ required, children }) => (
    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest leading-none">
        {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
);

export const FormInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = 'text' }) => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none hover:border-gray-300 transition-all placeholder:text-gray-300" />
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
        active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        inactive: { label: 'Đã khóa', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        locked: { label: 'Đã khóa', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        suspended: { label: 'Tạm khóa', cls: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
        borrowing: { label: 'Đang mượn', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        returned: { label: 'Đã trả', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        overdue: { label: 'Quá hạn', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        published: { label: 'Đã đăng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        draft: { label: 'Nháp', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
        pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
        confirmed: { label: 'Đã xác nhận', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        picked_up: { label: 'Đã nhận', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
        cancelled: { label: 'Đã hủy', cls: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-300' },
        expired: { label: 'Quá hạn nhận', cls: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

export const Pagination: React.FC<{ current: number; total: number; onChange: (p: number) => void; resultText: string }> = ({ current, total, onChange, resultText }) => (
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-medium text-gray-500">
        <p>{resultText}</p>
        <div className="flex items-center gap-1">
            <button disabled={current === 1} onClick={() => onChange(current - 1)} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg></button>
            <span className="px-2 text-gray-900">Trang {current} / {Math.max(total, 1)}</span>
            <button disabled={current >= total} onClick={() => onChange(current + 1)} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg></button>
        </div>
    </div>
);
