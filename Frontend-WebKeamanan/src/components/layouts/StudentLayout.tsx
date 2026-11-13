import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  BookOpenCheck,
  FileText,
  History,
  LogOut,
  User,
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard Siswa', path: '/student', icon: LayoutDashboard },
    { label: 'Ujian Tersedia', path: '/student/exams', icon: BookOpenCheck },
    { label: 'Materi Belajar', path: '/student/materials', icon: FileText },
    { label: 'Riwayat Ujian', path: '/student/history', icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/student" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-navy-900 to-royal-600 flex items-center justify-center text-white shadow-md shadow-royal-600/20">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-navy-950 text-lg tracking-tight">
                ExamCenter <span className="text-xs font-semibold text-royal-600 px-2 py-0.5 bg-royal-50 rounded-full">Siswa</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/student' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-royal-600 bg-royal-50'
                        : 'text-slate-600 hover:text-royal-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-royal-100 text-royal-700 font-bold text-xs flex items-center justify-center">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.full_name || 'Siswa'}</div>
                <div className="text-[11px] text-slate-400">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex border-t border-slate-100 overflow-x-auto px-2 py-1 bg-white">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-lg ${
                  isActive ? 'text-royal-600 bg-royal-50' : 'text-slate-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

