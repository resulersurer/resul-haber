import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <div className="flex-1 p-8 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
