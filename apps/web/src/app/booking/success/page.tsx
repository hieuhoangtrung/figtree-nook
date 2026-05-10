'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBookingBySession } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Calendar, Users, Home } from 'lucide-react';

function BookingSuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get('session_id') || '';

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-confirm', sessionId],
    queryFn: () => getBookingBySession(sessionId),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 2000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-airbnb-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-airbnb-gray">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-airbnb-light flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-card p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Booking Confirmed! 🎉</h1>
        <p className="text-airbnb-gray mb-8">
          Your booking at Figtree Nook is confirmed. A confirmation email has been sent to {booking?.guestEmail}.
        </p>

        {booking && (
          <div className="bg-airbnb-light rounded-2xl p-6 text-left mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-airbnb-pink" />
              <div>
                <p className="text-xs text-airbnb-gray">Property</p>
                <p className="font-medium">Figtree Nook — Private Studio</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-airbnb-pink" />
              <div>
                <p className="text-xs text-airbnb-gray">Dates</p>
                <p className="font-medium">{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</p>
                <p className="text-xs text-airbnb-gray">{booking.nights} night{booking.nights > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-airbnb-pink" />
              <div>
                <p className="text-xs text-airbnb-gray">Guests</p>
                <p className="font-medium">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="border-t border-airbnb-border pt-4">
              <div className="flex justify-between font-bold">
                <span>Total paid</span>
                <span>{formatCurrency(booking.totalPrice)} AUD</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left mb-8">
          <p className="font-semibold mb-2">🔑 Check-in Information</p>
          <ul className="space-y-1">
            <li>• Check-in is self-service via key safe</li>
            <li>• Check-in time: after 3:00 PM</li>
            <li>• Check-out time: before 11:00 AM</li>
            <li>• Exact address will be sent 24 hours before arrival</li>
          </ul>
        </div>

        <Link href="/" className="btn-primary inline-block w-full py-4">
          Back to listing
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-airbnb-pink border-t-transparent rounded-full animate-spin" /></div>}>
      <BookingSuccessInner />
    </Suspense>
  );
}
