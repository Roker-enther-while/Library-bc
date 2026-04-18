'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, MapPin } from 'lucide-react';
import { Modal, ModalFooter, FormLabel, FormInput, StatusBadge } from './AdminUIHelper';
import { LiteraryWork, LibraryMember } from '@/types';
import { getCopiesByBook, addCopy, deleteCopy } from '@/lib/apiClient';

interface BookModalProps {
    editingBook: LiteraryWork | null;
    bookForm: any;
    setBookForm: (v: any) => void;
    authors: any[];
    categories: any[];
    onClose: () => void;
    onSave: () => void;
}

export const BookModal: React.FC<BookModalProps> = ({ editingBook, bookForm, setBookForm, authors, categories, onClose, onSave }) => {
    const [copies, setCopies] = useState<any[]>([]);
    const [newBarcode, setNewBarcode] = useState('');
    const [activeTab, setActiveTab] = useState<'info' | 'copies'>('info');
    const [loadingCopies, setLoadingCopies] = useState(false);

    useEffect(() => {
        if (editingBook && activeTab === 'copies') {
            loadCopies();
        }
    }, [editingBook, activeTab]);

    const loadCopies = async () => {
        if (!editingBook) return;
        setLoadingCopies(true);
        try {
            const data = await getCopiesByBook(editingBook._id || editingBook.id);
            setCopies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCopies(false);
        }
    };

    const handleAddCopy = async () => {
        if (!newBarcode.trim() || !editingBook) return;
        try {
            await addCopy({
                bookId: editingBook._id || editingBook.id,
                barcode: newBarcode,
                shelfLocation: bookForm.shelfLocation,
                condition: 'new'
            });
            setNewBarcode('');
            loadCopies();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi khi thêm bản sao');
        }
    };

    const handleDeleteCopy = async (id: string) => {
        if (!confirm('Xác nhận xóa bản sao này?')) return;
        try {
            await deleteCopy(id);
            loadCopies();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-900">{editingBook ? 'Cập nhật tác phẩm' : 'Thêm tác phẩm mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                {editingBook && (
                    <div className="flex border-b border-gray-100 bg-white">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Thông tin chung
                        </button>
                        <button
                            onClick={() => setActiveTab('copies')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'copies' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Danh sách bản sao (BookItem)
                        </button>
                    </div>
                )}

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {activeTab === 'info' ? (
                        <>
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
                                    <input type="number" disabled={!!editingBook} value={bookForm.quantity} onChange={e => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-gray-50" />
                                    {editingBook && <p className="text-[10px] text-gray-400 mt-1 italic">*Số lượng tự động cập nhật qua Tab Bản sao</p>}
                                </div>
                                <div>
                                    <FormLabel required>Hiện có</FormLabel>
                                    <input type="number" disabled={!!editingBook} value={bookForm.available} onChange={e => setBookForm({ ...bookForm, available: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-gray-50" />
                                </div>
                            </div>
                            <div>
                                <FormLabel>Vị trí kệ sách (Shelf Location)</FormLabel>
                                <input type="text" value={bookForm.shelfLocation || ''} onChange={e => setBookForm({ ...bookForm, shelfLocation: e.target.value })} placeholder="VD: Khu A - Kệ 3 - Ngăn 2" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                            </div>
                            <div>
                                <FormLabel>Mô tả ngắn</FormLabel>
                                <textarea value={bookForm.summary || ''} onChange={e => setBookForm({ ...bookForm, summary: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                <input
                                    type="text"
                                    value={newBarcode}
                                    onChange={e => setNewBarcode(e.target.value)}
                                    placeholder="Nhập mã vạch (Barcode) mới..."
                                    className="flex-1 px-4 py-2 rounded-xl text-sm border-none focus:ring-0"
                                />
                                <button
                                    onClick={handleAddCopy}
                                    className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {loadingCopies ? (
                                    <p className="text-center py-10 text-xs italic">Đang tải danh sách bản sao...</p>
                                ) : copies.map(copy => (
                                    <div key={copy._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="text-blue-500" />
                                            <div>
                                                <p className="font-bold text-gray-900">{copy.barcode}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={10} /> {copy.shelfLocation || 'Chưa gán'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${copy.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {copy.status === 'available' ? 'Sẵn sàng' : 'Đang cho mượn'}
                                            </span>
                                            <button onClick={() => handleDeleteCopy(copy._id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {copies.length === 0 && !loadingCopies && <p className="text-center py-10 text-xs text-gray-400 italic">Chưa có bản sao nào được gán mã vạch.</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all text-sm">Hủy</button>
                    <button onClick={onSave} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg transition-all text-sm">Lưu tác phẩm</button>
                </div>
            </div>
        </div>
    );
};

export const AuthorModal: React.FC<any> = ({ editingAuthor, authorForm, setAuthorForm, onClose, onSave }) => (
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

export const CategoryModal: React.FC<any> = ({ editingCategory, categoryForm, setCategoryForm, onClose, onSave }) => (
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

export const MemberModal: React.FC<any> = ({ editingMember, memberForm, setMemberForm, onClose, onSave }) => (
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

export const ViewingMemberModal: React.FC<any> = ({ viewingMember, onClose }) => (
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

export const BorrowModal: React.FC<any> = ({ borrowForm, setBorrowForm, books, members, onClose, onSave }) => {
    const [barcodeMode, setBarcodeMode] = React.useState(true);
    const [scannedBook, setScannedBook] = React.useState<any>(null);
    const [searchBarcode, setSearchBarcode] = React.useState('');

    const handleLookupBarcode = async () => {
        if (!searchBarcode.trim()) return;
        try {
            const { getCopyByBarcode } = await import('@/lib/apiClient');
            const copy = await getCopyByBarcode(searchBarcode);
            setScannedBook(copy.book);
            setBorrowForm({ ...borrowForm, bookId: copy.book._id || copy.book.id });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không tìm thấy sách với mã vạch này');
            setScannedBook(null);
        }
    };

    return (
        <Modal title="Lập phiếu mượn mới" onClose={onClose} headerColor="#3A7CA5">
            <div className="p-6 space-y-4">
                <div className="flex gap-2 mb-2 p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setBarcodeMode(true)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${barcodeMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        Quét Mã Vạch
                    </button>
                    <button
                        onClick={() => setBarcodeMode(false)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!barcodeMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        Chọn từ Danh sách
                    </button>
                </div>

                {barcodeMode ? (
                    <div className="space-y-3">
                        <div>
                            <FormLabel required>Nhập/Quét Mã vạch (Barcode)</FormLabel>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchBarcode}
                                    onChange={e => setSearchBarcode(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                                    placeholder="VD: BOOK123456"
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookupBarcode()}
                                />
                                <button
                                    onClick={handleLookupBarcode}
                                    className="px-4 bg-gray-900 text-white rounded-xl text-xs font-bold"
                                >
                                    Tìm
                                </button>
                            </div>
                        </div>
                        {scannedBook && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-fadeIn">
                                <img src={scannedBook.coverImage} className="w-10 h-14 object-cover rounded shadow-sm" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-emerald-900">{scannedBook.title}</p>
                                    <p className="text-[10px] text-emerald-600 italic">ISBN: {scannedBook.isbn || 'N/A'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <FormLabel required>Chọn tác phẩm</FormLabel>
                        <select value={borrowForm.bookId} onChange={e => setBorrowForm({ ...borrowForm, bookId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                            <option value="">-- Chọn sách --</option>
                            {books.filter((b: any) => (b.available ?? 0) > 0).map((b: any) => (
                                <option key={b.id} value={b.id}>{b.title} (Còn {b.available ?? 0})</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <FormLabel required>Chọn độc giả</FormLabel>
                    <select value={borrowForm.memberId} onChange={e => setBorrowForm({ ...borrowForm, memberId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                        <option value="">-- Chọn độc giả --</option>
                        {members.filter((m: LibraryMember) => m.cardStatus === 'active').map((m: LibraryMember) => (
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
};

export const NewsModal: React.FC<any> = ({ editingNews, newsForm, setNewsForm, onClose, onSave }) => (
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

export const AccountModal: React.FC<any> = ({ editingAccount, accountForm, setAccountForm, onClose, onSave }) => (
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
