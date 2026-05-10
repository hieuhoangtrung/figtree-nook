'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminBookings, updateBooking } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
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
                {bookings.map((b: Record<string, unknown>) => (
                  <tr key={b.id as string} className="hover:bg-airbnb-light transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-sm">{b.guestName as string}</p>
                      <p className="text-xs text-airbnb-gray">{b.guestEmail as string}</p>
                      {b.guestPhone && <p className="text-xs text-airbnb-gray">{b.guestPhone as string}</p>}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <p>{formatDate(b.checkIn as string, 'd MMM yy')}</p>
                      <p className="text-airbnb-gray">→ {formatDate(b.checkOut as string, 'd MMM yy')}</p>
                      <p className="text-xs text-airbnb-gray">{b.nights as number} nights</p>
                    </td>
                    <td className="px-4 py-4 text-sm">{b.guests as number}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{formatCurrency(b.totalPrice as number)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status as string] || ''}`}>
                        {b.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-airbnb-gray">{formatDate(b.createdAt as string, 'd MMM yy')}</td>
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
              <p><strong>Guest:</strong> {selectedBooking.guestName as string}</p>
              <p><strong>Email:</strong> {selectedBooking.guestEmail as string}</p>
              <p><strong>Phone:</strong> {selectedBooking.guestPhone as string || 'N/A'}</p>
              <p><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn as string)}</p>
              <p><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut as string)}</p>
              <p><strong>Nights:</strong> {selectedBooking.nights as number}</p>
              <p><strong>Guests:</strong> {selectedBooking.guests as number}</p>
              <p><strong>Total:</strong> {formatCurrency(selectedBooking.totalPrice as number)}</p>
              <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedBooking.status as string]}`}>{selectedBooking.status as string}</span></p>
              {selectedBooking.notes && <p><strong>Notes:</strong> {selectedBooking.notes as string}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['CONFIRMED', 'CANCELLED', 'REFUNDED'] as const).filter(s => s !== selectedBooking.status).map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus({ id: selectedBooking.id as string, status: s })}
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
