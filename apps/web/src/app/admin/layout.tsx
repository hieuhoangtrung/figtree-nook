'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, MessageSquare, DollarSign, Settings, LogOut, BarChart3, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/admin/messages', label: 'Contact Messages', icon: MessageSquare },
  { href: '/admin/templates', label: 'Templates', icon: Settings },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/admin/reviews', label: 'Reviews', icon: Settings },
  { href: '/admin/theme', label: 'Theme', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    const token = localStorage.getItem('admin_token');
    if (!token) router.push('/admin/login');
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-airbnb-border transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-airbnb-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-airbnb-pink rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Figtree Nook</p>
                <p className="text-xs text-airbnb-gray">Admin Portal</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-airbnb-pink text-white'
                    : 'text-airbnb-gray hover:bg-airbnb-light hover:text-airbnb-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-airbnb-border">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-airbnb-gray hover:bg-airbnb-light transition-colors mb-1">
              <Home className="w-4 h-4" />
              View listing
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-airbnb-gray hover:bg-airbnb-light transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-airbnb-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-airbnb-light">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold">Figtree Nook Admin</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
