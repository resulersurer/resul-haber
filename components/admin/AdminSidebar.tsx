'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Rss, 
  FileCode, 
  FileText, 
  Globe, 
  Settings as SettingsIcon, 
  LogOut,
  User
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Haber Kaynakları', path: '/admin/news-sources', icon: Rss },
    { name: 'Ham Haberler', path: '/admin/raw-news', icon: FileCode },
    { name: 'AI Taslaklar', path: '/admin/article-drafts', icon: FileText },
    { name: 'Yayınlanan Haberler', path: '/admin/published-articles', icon: Globe },
    { name: 'Ayarlar', path: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand area */}
      <div className="p-6 border-b border-slate-800 flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
          ersurer.com
        </span>
        <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-1">
          AI Editör Paneli
        </span>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-slate-800/80 text-emerald-400 shadow-inner border border-slate-700/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Log out */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">Resul Ersürer</p>
            <p className="text-[10px] text-slate-500 truncate">{session?.user?.email || 'admin@ersurer.com'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Oturumu Kapat</span>
        </button>
      </div>
    </aside>
  );
}
