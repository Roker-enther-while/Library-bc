'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Modal, ModalFooter, FormLabel, FormInput, StatusBadge } from './AdminUIHelper';
import { LiteraryWork, LibraryMember } from '@/types';

interface BookModalProps {
    editingBook: LiteraryWork | null;
    bookForm: any;
    setBookForm: (v: any) => void;
    authors: any[];
    categories: any[];
    onClose: () => void;
    onSave: () => void;
}

export const BookModal: React.FC<BookModalProps> = ({ editingBook, bookForm, setBookForm, authors, categories, onClose, onSave }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-bold text-gray-900">{editingBook ? 'Cập nhật tác phẩm' : 'Thêm tác phẩm mới'}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                    <FormLabel required>Tiêu đề sách</FormLabel>
                    <input type="text" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <FormLabel required>Tác giả</FormLabel>
                        <select value={bookForm.authorId || ''} onChange={e => {
                            const author = authors.find(a => a.id === e.target.value || a._id === e.target.value);
                            setBookForm({ ...bookForm, authorId: e.target.value, authorName: author?.name || '' });
                        }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white">
                            <option value="">-- Chọn tác giả --</option>
                            {authors.map(a => <option key={a.id || a._id} value={a.id || a._id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <FormLabel required>Thể loại</FormLabel>
                        <select value={bookForm.category || ''} onChange={e => {
                            const cat = categories.find(c => c.id === e.target.value || c._id === e.target.value);
                            setBookForm({ ...bookForm, category: e.target.value, categoryName: cat?.name || '' });
                        }} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white">
                            <option value="">-- Chọn thể loại --</option>
                            {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <FormLabel>Năm XB</FormLabel>
                        <input type="number" value={bookForm.year || ''} onChange={e => setBookForm({ ...bookForm, year: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                    </div>
                    <div>
                        <FormLabel required>Số lượng</FormLabel>
                        <input type="number" value={bookForm.quantity} onChange={e => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                    </div>
                    <div>
                        <FormLabel required>Hiện có</FormLabel>
                        <input type="number" value={bookForm.available} onChange={e => setBookForm({ ...bookForm, available: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                    </div>
                </div>
                <div>
                    <FormLabel>Mô tả ngắn</FormLabel>
                    <textarea value={bookForm.summary || ''} onChange={e => setBookForm({ ...bookForm, summary: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all text-sm">Hủy</button>
                <button onClick={onSave} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg transition-all text-sm">Lưu tác phẩm</button>
            </div>
        </div>
    </div>
);

interface AuthorModalProps {
    editingAuthor: any;
    authorForm: any;
    setAuthorForm: (v: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({ editingAuthor, authorForm, setAuthorForm, onClose, onSave }) => (
    <Modal title={editingAuthor ? 'Cập nhật Tác giả' : 'Thêm Tác giả mới'} onClose={onClose} headerColor="#7C3AED">
        <div className="p-6 space-y-4">
            <div><FormLabel required>Tên tác giả</FormLabel><FormInput value={authorForm.name} onChange={v => setAuthorForm({ ...authorForm, name: v })} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><FormLabel>Mã tác giả (slug)</FormLabel><FormInput value={authorForm.id} onChange={v => setAuthorForm({ ...authorForm, id: v })} placeholder="vd: to-huu" /></div>
                <div><FormLabel>Năm sinh</FormLabel><FormInput type="number" value={authorForm.birthYear} onChange={v => setAuthorForm({ ...authorForm, birthYear: v })} /></div>
            </div>
            <div>
                <FormLabel>Tiểu sử</FormLabel>
                <textarea value={authorForm.bio} onChange={e => setAuthorForm({ ...authorForm, bio: e.target.value })} rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none" />
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel="Lưu tác giả" confirmColor="#7C3AED" />
    </Modal>
);

interface CategoryModalProps {
    editingCategory: any;
    categoryForm: any;
    setCategoryForm: (v: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ editingCategory, categoryForm, setCategoryForm, onClose, onSave }) => (
    <Modal title={editingCategory ? 'Cập nhật Thể loại' : 'Thêm Thể loại mới'} onClose={onClose} headerColor="#2D6A4F">
        <div className="p-6 space-y-4">
            <div><FormLabel required>Tên thể loại</FormLabel><FormInput value={categoryForm.name} onChange={v => setCategoryForm({ ...categoryForm, name: v })} /></div>
            <div><FormLabel required>Mã thể loại (Id)</FormLabel><FormInput value={categoryForm.id} onChange={v => setCategoryForm({ ...categoryForm, id: v })} placeholder="vd: tho, truyen-ngan" /></div>
            <div>
                <FormLabel>Mô tả</FormLabel>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500/20 outline-none" />
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel="Lưu thể loại" confirmColor="#2D6A4F" />
    </Modal>
);

interface MemberModalProps {
    editingMember: LibraryMember | null;
    memberForm: any;
    setMemberForm: (v: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({ editingMember, memberForm, setMemberForm, onClose, onSave }) => (
    <Modal title={editingMember ? `Cập nhật: ${editingMember.fullName}` : 'Thêm thành viên mới'} onClose={onClose} headerColor="#2D6A4F">
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><FormLabel required>Họ tên</FormLabel><FormInput value={memberForm.fullName} onChange={v => setMemberForm({ ...memberForm, fullName: v })} /></div>
                <div><FormLabel required>Mã số độc giả</FormLabel><FormInput value={memberForm.studentId} onChange={v => setMemberForm({ ...memberForm, studentId: v })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><FormLabel>Email</FormLabel><FormInput value={memberForm.email} onChange={v => setMemberForm({ ...memberForm, email: v })} /></div>
                <div><FormLabel required>Số điện thoại</FormLabel><FormInput value={memberForm.phone} onChange={v => setMemberForm({ ...memberForm, phone: v })} /></div>
            </div>
            <div>
                <FormLabel>Ghi chú thành viên</FormLabel>
                <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel={editingMember ? 'Cập nhật' : 'Thêm thành viên'} confirmColor="#2D6A4F" />
    </Modal>
);

interface ViewingMemberModalProps {
    viewingMember: LibraryMember;
    onClose: () => void;
}

export const ViewingMemberModal: React.FC<ViewingMemberModalProps> = ({ viewingMember, onClose }) => (
    <Modal title={`Chi tiết: ${viewingMember.fullName}`} onClose={onClose} headerColor="#1A1A2E" size="lg">
        <div className="p-6">
            <div className="flex items-center gap-5 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: viewingMember.avatarColor }}>
                    {viewingMember.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900">{viewingMember.fullName}</h4>
                    <p className="text-sm text-gray-500 mb-2">{viewingMember.studentId} · {viewingMember.email}</p>
                    <StatusBadge status={viewingMember.cardStatus} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-900">{viewingMember.totalBorrowed || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Tổng mượn</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-blue-600">{viewingMember.currentlyBorrowing || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Đang giữ</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-900">
                        {viewingMember.memberSince && !isNaN(new Date(viewingMember.memberSince).getTime())
                            ? new Date(viewingMember.memberSince).getFullYear()
                            : 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Năm tham gia</p>
                </div>
            </div>

            <div className="space-y-4">
                <h5 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3">Thông tin liên hệ & Ghi chú</h5>
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div><p className="text-gray-400 mb-1">Số điện thoại</p><p className="font-semibold">{viewingMember.phone || 'N/A'}</p></div>
                    <div><p className="text-gray-400 mb-1">Mã số sinh viên (MSV)</p><p className="font-semibold">{viewingMember.studentId || 'N/A'}</p></div>
                </div>
                <div className="pt-2">
                    <p className="text-gray-400 text-sm mb-1">Ghi chú quản lý</p>
                    <p className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-100 italic">
                        {viewingMember.notes || 'Không có ghi chú nào cho thành viên này.'}
                    </p>
                </div>
            </div>
        </div>
    </Modal>
);

interface BorrowModalProps {
    borrowForm: any;
    setBorrowForm: (v: any) => void;
    books: LiteraryWork[];
    members: LibraryMember[];
    onClose: () => void;
    onSave: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({ borrowForm, setBorrowForm, books, members, onClose, onSave }) => (
    <Modal title="Lập phiếu mượn mới" onClose={onClose} headerColor="#3A7CA5">
        <div className="p-6 space-y-4">
            <div>
                <FormLabel required>Chọn tác phẩm</FormLabel>
                <select value={borrowForm.bookId} onChange={e => setBorrowForm({ ...borrowForm, bookId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="">-- Chọn sách --</option>
                    {books.filter(b => (b.available ?? 0) > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.title} (Còn {b.available ?? 0})</option>
                    ))}
                </select>
            </div>
            <div>
                <FormLabel required>Chọn độc giả</FormLabel>
                <select value={borrowForm.memberId} onChange={e => setBorrowForm({ ...borrowForm, memberId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="">-- Chọn độc giả --</option>
                    {members.filter(m => m.cardStatus === 'active').map(m => (
                        <option key={m.id} value={m.id}>{m.fullName} - {m.studentId}</option>
                    ))}
                </select>
            </div>
            <div>
                <FormLabel>Ghi chú mượn</FormLabel>
                <textarea value={borrowForm.notes} onChange={e => setBorrowForm({ ...borrowForm, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Tình trạng sách, ngày hẹn trả..." />
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel="Xác nhận mượn" confirmColor="#3A7CA5" />
    </Modal>
);

interface NewsModalProps {
    editingNews: any;
    newsForm: any;
    setNewsForm: (v: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ editingNews, newsForm, setNewsForm, onClose, onSave }) => (
    <Modal title={editingNews ? 'Sửa tin tức' : 'Đăng tin mới'} onClose={onClose} headerColor="#C5973E" size="lg">
        <div className="p-6 space-y-4">
            <div><FormLabel required>Tiêu đề tin</FormLabel><FormInput value={newsForm.title} onChange={v => setNewsForm({ ...newsForm, title: v })} /></div>
            <div>
                <FormLabel required>Nội dung</FormLabel>
                <textarea value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} rows={8} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none" />
            </div>
            <div>
                <FormLabel>Trạng thái</FormLabel>
                <select value={newsForm.status} onChange={e => setNewsForm({ ...newsForm, status: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                    <option value="draft">Bản nháp</option>
                    <option value="published">Công khai</option>
                </select>
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel="Lưu tin" confirmColor="#C5973E" />
    </Modal>
);

interface AccountModalProps {
    editingAccount: any;
    accountForm: any;
    setAccountForm: (v: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ editingAccount, accountForm, setAccountForm, onClose, onSave }) => (
    <Modal title={editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'} onClose={onClose} headerColor="#7C3AED">
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><FormLabel required>Tên đăng nhập</FormLabel><FormInput value={accountForm.username} onChange={v => setAccountForm({ ...accountForm, username: v })} /></div>
                <div><FormLabel required={!editingAccount}>Mật khẩu</FormLabel><FormInput type="password" value={accountForm.password || ''} onChange={v => setAccountForm({ ...accountForm, password: v })} placeholder={editingAccount ? '(Để trống nếu không đổi)' : 'Nhập mật khẩu'} /></div>
            </div>
            <div><FormLabel required>Họ tên đầy đủ</FormLabel><FormInput value={accountForm.fullName} onChange={v => setAccountForm({ ...accountForm, fullName: v })} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <FormLabel>Vai trò</FormLabel>
                    <select value={accountForm.role} onChange={e => setAccountForm({ ...accountForm, role: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                        <option value="librarian">📚 Thủ thư</option>
                        <option value="admin">👑 Quản trị viên</option>
                    </select>
                </div>
                <div>
                    <FormLabel>Trạng thái</FormLabel>
                    <select value={accountForm.status} onChange={e => setAccountForm({ ...accountForm, status: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                        <option value="active">✅ Hoạt động</option>
                        <option value="inactive">🔒 Đã khóa</option>
                    </select>
                </div>
            </div>
        </div>
        <ModalFooter onCancel={onClose} onConfirm={onSave} confirmLabel="Lưu tài khoản" confirmColor="#7C3AED" />
    </Modal>
);
