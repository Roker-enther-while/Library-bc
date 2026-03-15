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
  _id?: string; // MongoDB ID
  title: string;
  author?: {
    id: string;
    name: string;
    birthYear?: number;
    deathYear?: number;
    bio?: string;
    era?: string;
    avatar?: string;
    region?: string;
  };
  authorId?: string;
  authorName?: string;
  category: CategoryInfo | { id: string; name?: string; description?: string; icon?: string; gradient?: string } | string;
  publicationYear?: number;
  year?: number | string;
  isbn?: string;
  publisher?: string;
  totalCopies?: number;
  availableCopies?: number;
  borrowCount?: number;
  shelfLocation?: string;
  coverImage?: string;
  coverUrl?: string;
  coverColor?: string;
  quantity?: number;
  available?: number;
  readTime?: number;
  views?: number;
  isFeatured?: boolean;
  summary?: string;
  significance?: string;
  excerpt?: string;
  fullText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Category = string;

export interface CategoryInfo {
  id: Category;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  count?: number;
}

export type Page =
  | 'home'
  | 'library'
  | 'authors'
  | 'categories'
  | 'reading'
  | 'author-detail'
  | 'favorites'
  | 'profile'
  | 'auth'
  | 'admin-login'
  | 'admin';

export interface AdminUser {
  id: string;
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
  user?: string | { id?: string; _id?: string; fullName: string; studentId?: string; phone?: string };
  book?: string | { id?: string; _id?: string; title: string };
  // Compatibility fields
  userId?: string;
  bookId?: string;
  bookTitle?: string;
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerStudentId?: string;
  librarianId?: string;
  librarianName?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowing' | 'borrowed' | 'returned' | 'overdue' | 'lost';
  fineAmount?: number;
  notes?: string;
}

export interface LibraryMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  studentId?: string;
  role: 'reader';
  cardStatus: 'active' | 'inactive' | 'suspended';
  memberSince: string;
  totalBorrowed: number;
  currentlyBorrowing: number;
  notes?: string;
  avatarColor?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userFullName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  barcode: string;
  shelfLocation: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'lost';
  condition: 'new' | 'good' | 'damaged' | 'worn';
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
  // include additional common combinations just in case
  'from-blue-500', 'to-cyan-800',
  'from-red-500', 'to-rose-800',
  'from-pink-500', 'to-fuchsia-800',
  'bg-gradient-to-br'
];
