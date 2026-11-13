import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  HelpCircle,
  FileSpreadsheet,
  BookMarked,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Bank Soal', path: '/admin/questions', icon: HelpCircle },
    { label: 'Impor Soal', path: '/admin/import', icon: FileSpreadsheet },
    { label: 'Kelola Ujian', path: '/admin/exams', icon: BookMarked },
    { label: 'Materi Belajar', path: '/admin/materials', icon: FileText },
    { label: 'Data Siswa', path: '/admin/students', icon: Users },
    { label: 'Jadwal Ujian', path: '/admin/schedules', icon: Calendar },
    { label: 'Analisis & Hasil', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Pengaturan & MFA', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-navy-900 select-none">
        {/* Brand */}
        <div className="p-6 border-b border-navy-900 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-royal-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight">ExamCenter</div>
            <div className="text-xs text-royal-400 font-semibold tracking-wider uppercase">Portal Admin</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-royal-600 text-white shadow-md shadow-royal-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-navy-900/80 bg-navy-950/50">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center space-x-2">
              {user?.isMfaEnabled ? (
                <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  MFA Aktif
                </span>
              ) : (
                <span className="flex items-center text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  MFA Nonaktif
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="min-w-0 flex-1 mr-2">
              <div className="text-sm font-bold text-white truncate">{user?.full_name || 'Administrator'}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-navy-900 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="text-sm font-semibold text-slate-700 hidden sm:block">
              Sistem Manajemen Evaluasi & Bank Soal Terpadu
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Server Terhubung</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.full_name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-navy-950 text-white p-6 pt-20 flex flex-col justify-between">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium ${
                      isActive ? 'bg-royal-600 text-white' : 'text-slate-300 hover:bg-navy-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

