export interface Author {
    id: string;
    name: string;
    birthYear?: number;
    deathYear?: number;
    bio?: string;
    era?: string;
    avatar?: string;
    region?: string;
}

export interface LiteraryWork {
    id: string;
    _id?: string;
    title: string;
    slug?: string;
    author?: Author;
    authorId?: string;
    authorName?: string;
    category: CategoryInfo | string;
    categoryName?: string;
    publicationYear?: number;
    isbn?: string;
    publisher?: string;
    quantity: number;
    available: number; // Thống nhất dùng available thay vì availableCopies
    borrowCount?: number;
    shelfLocation?: string;
    coverImage?: string;
    coverColor?: string;
    readTime?: number;
    views?: number;
    isFeatured?: boolean;
    summary?: string;
    fineAmount?: number;
    fullText?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type Category = string;

export interface CategoryInfo {
    id: Category;
    _id?: string;
    name: string;
    description: string;
    icon: string;
    gradient: string;
    count?: number;
}

export interface AdminUser {
    id: string;
    _id?: string;
    username: string;
    password?: string;
    fullName: string;
    email: string;
    phone?: string;
    studentId?: string;
    cardStatus?: 'active' | 'inactive' | 'suspended' | 'locked';
    role: 'librarian' | 'reader' | 'admin';
    status: 'active' | 'inactive';
    penalties: number;
    createdAt: string;
    updatedAt?: string;
}

export interface BorrowRecord {
    id: string;
    _id?: string;
    user?: string | { _id?: string; fullName: string; studentId?: string; phone?: string };
    book?: string | { _id?: string; title: string };
    userId?: string;
    bookId?: string;
    bookTitle?: string;
    borrowerName?: string;
    borrowerPhone?: string;
    borrowerStudentId?: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'borrowing' | 'returned' | 'overdue' | 'lost';
    fineAmount?: number;
    renewCount?: number;
    notes?: string;
}

export interface LibraryMember {
    id: string;
    _id?: string;
    fullName: string;
    email: string;
    phone: string;
    studentId?: string;
    role: 'reader';
    cardStatus: 'active' | 'inactive' | 'suspended';
    memberSince: string;
    totalBorrowed: number;
    currentlyBorrowing: number;
    penalties: number;
    notes?: string;
    avatarColor?: string;
}

export interface NewsItem {
    id: string;
    _id?: string;
    title: string;
    slug?: string;
    content: string;
    status: 'published' | 'draft';
    createdAt: string;
    updatedAt?: string;
}

export interface ActivityLog {
    id: string;
    _id?: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    text: string;
    timestamp: Date;
    suggestions?: string[];
    books?: LiteraryWork[];
}

export const tailwindSafelist = [
    'from-purple-500', 'to-indigo-800',
    'from-emerald-600', 'to-teal-900',
    'from-amber-600', 'to-orange-800',
    'from-blue-500', 'to-cyan-800',
    'from-red-500', 'to-rose-800',
    'from-pink-500', 'to-fuchsia-800',
    'bg-gradient-to-br'
];
