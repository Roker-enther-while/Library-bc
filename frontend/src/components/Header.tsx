import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Search, Menu, X, Home, Library, Users, Grid3X3, Shield, Heart, Moon, Sun, User, LogOut, Clock, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchBooks } from '../services/api';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) { }
    } else {
      setUser(null);
    }
    setIsAdmin(!!localStorage.getItem('adminToken'));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const updateFavorites = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavoriteCount(favorites.length);
    };
    updateFavorites();
    window.addEventListener('storage', updateFavorites);
    return () => window.removeEventListener('storage', updateFavorites);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const navItems: { path: string; label: string; icon: React.ReactNode }[] = [
    { path: '/', label: 'Trang chủ', icon: <Home size={18} /> },
    { path: '/thu-vien', label: 'Thư viện', icon: <Library size={18} /> },
    { path: '/tac-gia', label: 'Tác giả', icon: <Users size={18} /> },
    { path: '/the-loai', label: 'Thể loại', icon: <Grid3X3 size={18} /> },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = activeIdx >= 0 && suggestions[activeIdx]
      ? suggestions[activeIdx].title
      : searchQuery;
    if (q.trim()) {
      navigate(`/thu-vien?q=${encodeURIComponent(q.trim())}`);
      closeSearch();
    }
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
    setActiveIdx(-1);
  }, []);

  const handleQueryChange = useCallback((val: string) => {
    setSearchQuery(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const results = await searchBooks(val.trim());
        setSuggestions((results || []).slice(0, 7));
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') closeSearch();
  };

  const pickSuggestion = (book: any) => {
    navigate(`/thu-vien?q=${encodeURIComponent(book.title)}`);
    closeSearch();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isAdminPage
          ? 'bg-white/95 dark:bg-dark-card/95 backdrop-blur-md shadow-lg border-b border-gold/20 dark:border-gold/10'
          : 'bg-white/85 dark:bg-dark-card/85 backdrop-blur-sm border-b border-gold/10 dark:border-gold/5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-vermillion text-white">
                <BookOpen size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-lg sm:text-xl font-bold leading-tight transition-colors text-ink dark:text-parchment">
                  Văn Học Việt Nam
                </h1>
                <p className="text-[10px] sm:text-xs tracking-wider uppercase transition-colors text-gold-dark">
                  Kho tàng văn chương dân tộc
                </p>
              </div>
            </button>

            {!isAdminPage && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-300 ${location.pathname === item.path
                      ? 'bg-vermillion/10 text-vermillion dark:bg-vermillion/20'
                      : 'text-ink-light dark:text-gray-300 hover:bg-parchment-dark dark:hover:bg-dark-surface hover:text-ink dark:hover:text-white'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={() => navigate('/yeu-thich')}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-300 ${location.pathname === '/yeu-thich'
                    ? 'bg-vermillion/10 text-vermillion'
                    : 'text-ink-light dark:text-gray-300 hover:bg-parchment-dark dark:hover:bg-dark-surface'
                    }`}
                >
                  <Heart size={18} className={location.pathname === '/yeu-thich' ? 'fill-current' : ''} />
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-vermillion text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {favoriteCount > 9 ? '9+' : favoriteCount}
                    </span>
                  )}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      const adminUser = localStorage.getItem('adminUser');
                      if (adminUser) {
                        navigate('/admin');
                      } else {
                        navigate('/admin/dangnhap');
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans font-medium transition-all duration-300 ml-1 text-vermillion/70 dark:text-vermillion-light hover:bg-vermillion/10 hover:text-vermillion"
                  >
                    <Shield size={16} />
                    <span className="hidden lg:inline">Quản lý</span>
                  </button>
                )}
              </nav>
            )}

            <div className="flex items-center gap-2">
              {!isAdminPage && (
                <div className="hidden md:flex items-center gap-2 mr-2">
                  {user ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-medium text-ink dark:text-parchment">
                        Xin chào, {user.fullName?.split(' ').pop() || user.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl text-ink-light dark:text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
                        title="Đăng xuất"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/dang-nhap')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-sans font-medium bg-jade text-white hover:bg-jade-dark transition-all shadow-sm"
                    >
                      <User size={16} />
                      Đăng nhập
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl transition-all duration-300 text-ink-light dark:text-gray-300 hover:bg-parchment-dark dark:hover:bg-dark-surface"
                title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {!isAdminPage && (
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2.5 rounded-xl transition-all duration-300 text-ink-light dark:text-gray-300 hover:bg-parchment-dark dark:hover:bg-dark-surface"
                >
                  <Search size={20} />
                </button>
              )}

              {!isAdminPage && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-xl transition-all duration-300 text-ink-light dark:text-gray-300 hover:bg-parchment-dark dark:hover:bg-dark-surface"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {!isAdminPage && (
          <div
            className={`overflow-hidden transition-all duration-300 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-700 ${searchOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="max-w-3xl mx-auto px-4 py-3" ref={searchContainerRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm kiếm tác phẩm, tác giả..."
                    className="w-full pl-11 pr-4 py-3 bg-parchment dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-gold focus:border-transparent text-ink dark:text-parchment placeholder-gray-400 outline-none"
                    autoFocus
                  />
                  {suggestLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </form>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="mt-1.5 bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map((book, idx) => (
                    <button
                      key={book._id || book.id || idx}
                      onMouseDown={() => pickSuggestion(book)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === activeIdx
                          ? 'bg-gold/10 dark:bg-gold/20'
                          : 'hover:bg-parchment dark:hover:bg-dark-card'
                        }`}
                    >
                      {/* Book cover or icon */}
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden bg-vermillion/10 flex items-center justify-center">
                        {book.coverImage
                          ? <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                          : <BookOpen size={14} className="text-vermillion" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink dark:text-parchment truncate">{book.title}</p>
                        <p className="text-xs text-ink-light dark:text-gray-400 truncate">
                          {book.authorName || book.author?.name || ''}
                        </p>
                      </div>
                      <Search size={13} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                  <button
                    onMouseDown={() => {
                      if (searchQuery.trim()) {
                        navigate(`/thu-vien?q=${encodeURIComponent(searchQuery.trim())}`);
                        closeSearch();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-sm text-gold-dark dark:text-gold font-medium hover:bg-gold/5 transition-colors"
                  >
                    <TrendingUp size={14} />
                    Xem tất cả kết quả cho &ldquo;{searchQuery}&rdquo;
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!suggestLoading && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
                <div className="mt-1.5 bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-5 text-center">
                  <Clock size={18} className="mx-auto mb-1.5 text-gray-300" />
                  <p className="text-sm text-gray-400">Không tìm thấy kết quả nào cho &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {!isAdminPage && (
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'
            }`}
        >
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`absolute top-[64px] right-0 w-72 h-[calc(100vh-64px)] bg-white dark:bg-dark-card shadow-2xl transition-transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${location.pathname === item.path
                    ? 'bg-vermillion/10 text-vermillion'
                    : 'text-ink dark:text-parchment hover:bg-parchment-dark dark:hover:bg-dark-surface'
                    }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              <button
                onClick={() => {
                  navigate('/yeu-thich');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${location.pathname === '/yeu-thich'
                  ? 'bg-vermillion/10 text-vermillion'
                  : 'text-ink dark:text-parchment hover:bg-parchment-dark dark:hover:bg-dark-surface'
                  }`}
              >
                <Heart size={18} className={location.pathname === '/yeu-thich' ? 'fill-current' : ''} />
                <span className="font-medium">Yêu thích</span>
                {favoriteCount > 0 && (
                  <span className="ml-auto bg-vermillion text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

              {user ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-xs text-ink-light dark:text-gray-400 font-sans">Đăng nhập với tư cách</p>
                    <p className="font-medium text-ink dark:text-parchment">{user.fullName || user.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigate('/dang-nhap');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-jade hover:bg-jade/10 transition-all"
                >
                  <User size={18} />
                  <span className="font-medium">Đăng nhập</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    const adminUser = localStorage.getItem('adminUser');
                    if (adminUser) {
                      navigate('/admin');
                    } else {
                      navigate('/admin/dangnhap');
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-vermillion hover:bg-vermillion/10 transition-all"
                >
                  <Shield size={18} />
                  <span className="font-medium">Quản lý</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Header;
