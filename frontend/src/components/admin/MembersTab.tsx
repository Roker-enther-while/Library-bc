'use client';
import React from 'react';
import { Mail, Phone, Calendar, Pencil, Trash2, Eye, CheckSquare, XSquare } from 'lucide-react';
import { LibraryMember } from '@/types';
import { StatusBadge, Pagination } from './AdminUIHelper';

const fmtDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface MembersTabProps {
    members: LibraryMember[];
    memberFilter: string;
    setMemberFilter: (f: any) => void;
    setMemberPage: (p: number) => void;
    paginatedMembers: LibraryMember[];
    memberPage: number;
    totalMemberPages: number;
    filteredMembers: LibraryMember[];
    onView: (m: LibraryMember) => void;
    onEdit: (m: LibraryMember) => void;
    onToggleStatus: (m: LibraryMember) => void;
    onDelete: (m: LibraryMember) => void;
    PER_PAGE: number;
}

const MembersTab: React.FC<MembersTabProps> = ({
    members, memberFilter, setMemberFilter, setMemberPage,
    paginatedMembers, memberPage, totalMemberPages, filteredMembers,
    onView, onEdit, onToggleStatus, onDelete, PER_PAGE
}) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
            {[
                { v: 'all', l: 'Tất cả', c: members.length },
                { v: 'active', l: '✅ Hoạt động', c: members.filter(m => m.cardStatus === 'active').length },
                { v: 'suspended', l: '⚠️ Tạm khóa', c: members.filter(m => m.cardStatus === 'suspended').length },
                { v: 'inactive', l: '🔒 Đã khóa', c: members.filter(m => m.cardStatus === 'inactive').length },
            ].map(f => (
                <button key={f.v} onClick={() => { setMemberFilter(f.v); setMemberPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${memberFilter === f.v ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {f.l}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${memberFilter === f.v ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{f.c}</span>
                </button>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedMembers.map(m => (
                <div key={m._id || m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${m.avatarColor || '#A52422'}, ${(m.avatarColor || '#A52422') + '99'})` }}>
                                {m.fullName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-[13px]">{m.fullName}</p>
                                {m.studentId && <p className="text-[11px] text-gray-400 font-mono">{m.studentId}</p>}
                            </div>
                        </div>
                        <StatusBadge status={m.cardStatus} />
                    </div>
                    <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-[12px] text-gray-500"><Mail size={11} className="text-gray-400 flex-shrink-0" /><span className="truncate">{m.email}</span></div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500"><Phone size={11} className="text-gray-400 flex-shrink-0" /><span>{m.phone}</span></div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500"><Calendar size={11} className="text-gray-400 flex-shrink-0" /><span>Từ {fmtDate(m.memberSince)}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-gray-50">
                        <div className="text-center">
                            <p className="text-lg font-bold text-emerald-700">{m.totalBorrowed}</p>
                            <p className="text-[10px] text-gray-400">Tổng mượn</p>
                        </div>
                        <div className="text-center border-l border-gray-200">
                            <p className={`text-lg font-bold ${m.currentlyBorrowing > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{m.currentlyBorrowing}</p>
                            <p className="text-[10px] text-gray-400">Đang mượn</p>
                        </div>
                    </div>
                    {m.notes && <p className="text-[11px] text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">⚠️ {m.notes}</p>}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button onClick={() => onView(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-600 text-[12px] font-semibold hover:bg-gray-100 transition-colors border border-gray-200">
                            <Eye size={11} />
                        </button>
                        <button onClick={() => onEdit(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-[12px] font-semibold hover:bg-blue-100 transition-colors">
                            <Pencil size={11} /> Sửa
                        </button>
                        <button onClick={() => onToggleStatus(m)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[12px] font-semibold transition-colors ${m.cardStatus === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {m.cardStatus === 'active' ? (
                                <><XSquare size={11} /> Khóa</>
                            ) : (
                                <><CheckSquare size={11} /> Mở</>
                            )}
                        </button>
                        <button onClick={() => onDelete(m)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            ))}
            {paginatedMembers.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                    <p className="text-sm">Không tìm thấy thành viên nào</p>
                </div>
            )}
        </div>
        {totalMemberPages > 1 && <div className="bg-white rounded-2xl border border-gray-100"><Pagination current={memberPage} total={totalMemberPages} onChange={setMemberPage} resultText={`${(memberPage - 1) * PER_PAGE + 1}–${Math.min(memberPage * PER_PAGE, filteredMembers.length)} / ${filteredMembers.length} thành viên`} /></div>}
    </div>
);

export default MembersTab;
