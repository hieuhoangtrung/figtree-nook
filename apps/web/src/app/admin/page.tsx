'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, DollarSign, MessageSquare, Users, TrendingUp } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-airbnb-border p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-airbnb-gray">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <div className="text-center py-16 text-airbnb-gray animate-pulse">Loading dashboard...</div>;
  }

  const { stats, upcomingBookings, recentBookings } = data || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-airbnb-gray mt-1">Welcome back, Trang! Here's your property overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bookings" value={stats?.totalBookings || 0} icon={Calendar} color="bg-blue-500" />
        <StatCard label="Confirmed" value={stats?.confirmedBookings || 0} icon={Users} color="bg-green-500" />
        <StatCard label="Pending" value={stats?.pendingBookings || 0} icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue || 0)} icon={DollarSign} color="bg-airbnb-pink" />
      </div>

      {/* Unread messages alert */}
      {stats?.unreadMessages > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              You have {stats.unreadMessages} unread message{stats.unreadMessages > 1 ? 's' : ''}
            </p>
          </div>
          <a href="/admin/messages" className="text-sm font-medium text-amber-700 hover:underline">View →</a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4">Upcoming Bookings</h2>
          {upcomingBookings?.length === 0 ? (
            <p className="text-airbnb-gray text-sm">No upcoming bookings.</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings?.map((b: { id: string; guestName: string; checkIn: string; checkOut: string; nights: number; guests: number; totalPrice: number }) => (
                <div key={b.id} className="flex items-center justify-between border-b border-airbnb-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{b.guestName}</p>
                    <p className="text-xs text-airbnb-gray">{formatDate(b.checkIn, 'd MMM')} → {formatDate(b.checkOut, 'd MMM')} · {b.nights}n · {b.guests}g</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(b.totalPrice)}</p>
                </div>
              ))}
            </div>
          )}
          <a href="/admin/bookings" className="text-sm text-airbnb-pink font-medium mt-4 inline-block hover:underline">View all bookings →</a>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          {recentBookings?.length === 0 ? (
            <p className="text-airbnb-gray text-sm">No recent bookings.</p>
          ) : (
            <div className="space-y-4">
              {recentBookings?.map((b: { id: string; guestName: string; status: string; totalPrice: number; checkIn: string }) => (
                <div key={b.id} className="flex items-center justify-between border-b border-airbnb-border pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{b.guestName}</p>
                    <p className="text-xs text-airbnb-gray">Check-in: {formatDate(b.checkIn, 'd MMM yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(b.totalPrice)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
