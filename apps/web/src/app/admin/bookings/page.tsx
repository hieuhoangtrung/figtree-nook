'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminBookings, updateBooking } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Filter } from 'lucide-react';

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  notes?: string | null;
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter, page],
    queryFn: () => getAdminBookings({ status: statusFilter || undefined, page }),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBooking(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Booking status updated');
      setSelectedBooking(null);
    },
    onError: () => toast.error('Failed to update booking'),
  });

  const bookings = data?.bookings || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-airbnb-gray text-sm mt-1">{data?.total || 0} total bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-airbnb-dark text-white' : 'bg-white border border-airbnb-border text-airbnb-gray hover:border-airbnb-dark'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-2xl border border-airbnb-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-airbnb-gray animate-pulse">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-airbnb-gray">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-airbnb-light border-b border-airbnb-border">
                <tr>
                  {['Guest', 'Dates', 'Guests', 'Total', 'Status', 'Booked', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-airbnb-gray uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-airbnb-border">
                {bookings.map((b: Booking) => (
                  <tr key={b.id} className="hover:bg-airbnb-light transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-sm">{b.guestName}</p>
                      <p className="text-xs text-airbnb-gray">{b.guestEmail}</p>
                      {b.guestPhone && <p className="text-xs text-airbnb-gray">{b.guestPhone}</p>}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p>{formatDate(b.checkIn, 'd MMM yy')}</p>
                      <p className="text-airbnb-gray">→ {formatDate(b.checkOut, 'd MMM yy')}</p>
                      <p className="text-xs text-airbnb-gray">{b.nights} nights</p>
                    </td>
                    <td className="px-4 py-4 text-sm">{b.guests}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{formatCurrency(b.totalPrice)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status] || ''}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-airbnb-gray">{formatDate(b.createdAt, 'd MMM yy')}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="text-xs font-medium text-airbnb-pink hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-2">Previous</button>
          <span className="px-4 py-2 text-sm text-airbnb-gray">Page {page}</span>
          <button disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-2">Next</button>
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Manage Booking</h3>
            <div className="space-y-2 text-sm mb-6">
              <p><strong>Guest:</strong> {selectedBooking.guestName}</p>
              <p><strong>Email:</strong> {selectedBooking.guestEmail}</p>
              <p><strong>Phone:</strong> {selectedBooking.guestPhone || 'N/A'}</p>
              <p><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn)}</p>
              <p><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut)}</p>
              <p><strong>Nights:</strong> {selectedBooking.nights}</p>
              <p><strong>Guests:</strong> {selectedBooking.guests}</p>
              <p><strong>Total:</strong> {formatCurrency(selectedBooking.totalPrice)}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedBooking.status]}`}>{selectedBooking.status}</span></p>
              {selectedBooking.notes && <p><strong>Notes:</strong> {selectedBooking.notes}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['CONFIRMED', 'CANCELLED', 'REFUNDED'] as const).filter(s => s !== selectedBooking.status).map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus({ id: selectedBooking.id, status: s })}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Mark {s}
                </button>
              ))}
              <button onClick={() => setSelectedBooking(null)} className="btn-secondary text-xs py-2 px-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
