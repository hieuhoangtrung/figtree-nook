'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Search, Home, Calendar } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('Valid email required'),
  bookingId: z.string().min(4, 'Enter at least the last 4 characters of your booking reference'),
});
type FormData = z.infer<typeof schema>;

export default function MyBookingLookupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.get('/api/my-booking', {
        params: { email: data.email, bookingId: data.bookingId },
      });
      const booking = res.data.booking;
      router.push(`/my-booking/${booking.id}?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Booking not found. Please check your email and reference.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-airbnb-light flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-airbnb-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-airbnb-pink font-bold text-xl">
            <Home className="w-6 h-6" />
            Figtree Nook
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-airbnb-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Manage your booking</h1>
            <p className="text-airbnb-gray mt-2">
              Enter your email and booking reference to view, cancel, or reschedule your stay.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="The email used for booking"
                  className="input-field"
                  autoFocus
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Booking reference</label>
                <input
                  {...register('bookingId')}
                  placeholder="Last 6+ characters from your confirmation email"
                  className="input-field"
                />
                {errors.bookingId && <p className="text-red-500 text-xs mt-1">{errors.bookingId.message}</p>}
                <p className="text-xs text-airbnb-gray mt-1">
                  Found in your booking confirmation email (e.g. <code className="bg-gray-100 px-1 rounded">abc123</code>)
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isSubmitting ? 'Looking up...' : 'Find my booking'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-airbnb-border text-center">
              <p className="text-sm text-airbnb-gray">
                Need help?{' '}
                <Link href="/#contact" className="text-airbnb-pink hover:underline font-medium">
                  Contact the host
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
