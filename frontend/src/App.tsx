import React, { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import BottomNavigation from './components/BottomNavigation';
import { ToastProvider } from './components/Toast';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import AuthorsPage from './pages/AuthorsPage';
import CategoriesPage from './pages/CategoriesPage';
import ReadingPage from './pages/ReadingPage';
import AuthorDetailPage from './pages/AuthorDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { Routes, Route, useLocation } from 'react-router-dom';
const App: React.FC = () => {
  const location = useLocation();
  // Initialize dark mode from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/dang-nhap';
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-parchment dark:bg-dark-bg transition-colors duration-300">
        {!isAdminPage && (
          <Header />
        )}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/thu-vien" element={<LibraryPage />} />
            <Route path="/tac-gia" element={<AuthorsPage />} />
            <Route path="/tac-gia/:id" element={<AuthorDetailPage />} />
            <Route path="/the-loai" element={<CategoriesPage />} />
            <Route path="/doc/:id" element={<ReadingPage />} />
            <Route path="/yeu-thich" element={<FavoritesPage />} />
            <Route path="/ho-so-ca-nhan" element={<ProfilePage />} />
            <Route path="/dang-nhap" element={<AuthPage />} />
            <Route path="/admin/dangnhap" element={<AdminLoginPage />} />
            <Route
              path="/admin/*"
              element={
                localStorage.getItem('adminToken') && localStorage.getItem('adminUser')
                  ? <AdminDashboard user={JSON.parse(localStorage.getItem('adminUser') || '{}')} />
                  : <AdminLoginPage />
              }
            />
            {/* Fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        {!isAdminPage && <Footer />}
        {/* Scroll to Top Button */}
        <ScrollToTop />
        {/* Bottom Navigation for Mobile */}
        {!isAdminPage && (
          <BottomNavigation />
        )}
      </div>
    </ToastProvider>
  );
};
export default App;
