'use client';
import React from 'react';
import { Pencil, Trash2, Shield, Lock, Unlock } from 'lucide-react';
import { AdminUser } from '@/types';
import { StatusBadge } from './AdminUIHelper';

interface AccountsTabProps {
    accounts: AdminUser[];
    currentUserId: string;
    isAdmin: boolean;
    onAdd: () => void;
    onEdit: (a: AdminUser) => void;
    onDelete: (a: AdminUser) => void;
    onToggleStatus: (a: AdminUser) => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({
    accounts, currentUserId, isAdmin, onAdd, onEdit, onDelete, onToggleStatus
}) => {
    const staffAccounts = accounts.filter((a: AdminUser) => a.role !== 'reader' || a.status === 'inactive');
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{staffAccounts.length} tài khoản nhân viên · {staffAccounts.filter(a => a.status === 'active').length} đang hoạt động</p>
                {isAdmin && (
                    <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#0F172A,#1E1B4B)' }}>
                        + Thêm tài khoản
                    </button>
                )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tài khoản</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Liên hệ</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vai trò</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        {isAdmin && <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {staffAccounts.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                            style={{ background: acc.role === 'admin' ? 'linear-gradient(135deg,#A52422,#C5973E)' : 'linear-gradient(135deg,#3A7CA5,#2D6A4F)' }}>
                                            {acc.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-semibold text-gray-900 text-[13px]">{acc.fullName}</p>
                                                {acc.id === currentUserId && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full">Bạn</span>}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-mono">{acc.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    <p className="text-[13px] text-gray-600">{acc.email}</p>
                                    <p className="text-[11px] text-gray-400">{acc.phone}</p>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${acc.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                        <Shield size={10} />
                                        {acc.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-center"><StatusBadge status={acc.status || 'active'} /></td>
                                {isAdmin && (
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => onEdit(acc)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors" title="Sửa"><Pencil size={13} /></button>
                                            <button onClick={() => onToggleStatus(acc)} disabled={acc.id === currentUserId}
                                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${acc.status === 'active' ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-500'}`}
                                                title={acc.status === 'active' ? 'Khóa' : 'Kích hoạt'}>
                                                {acc.status === 'active' ? <Lock size={13} /> : <Unlock size={13} />}
                                            </button>
                                            <button onClick={() => onDelete(acc)} disabled={acc.id === currentUserId}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-30" title="Xóa">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {staffAccounts.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">Không có tài khoản nhân viên nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AccountsTab;
