'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getPricePreview, createCheckout } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  guestName: z.string().min(2, 'Full name required'),
  guestEmail: z.string().email('Valid email required'),
  guestPhone: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function BookingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = parseInt(params.get('guests') || '1');

  const { data: priceData, isLoading } = useQuery({
    queryKey: ['price-preview', checkIn, checkOut, guests],
    queryFn: () => getPricePreview(checkIn, checkOut, guests),
    enabled: !!(checkIn && checkOut),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createCheckout({ ...data, checkIn, checkOut, guests });
      window.location.href = result.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create booking. Please try again.';
      toast.error(msg);
    }
  };

  if (!checkIn || !checkOut) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-airbnb-gray mb-4">No dates selected.</p>
        <Link href="/" className="btn-primary inline-block">Go back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to listing
        </Link>

        <h1 className="text-2xl font-semibold mb-8">Confirm and pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Guest details form */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Your details</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full name *</label>
                <input {...register('guestName')} placeholder="As on your ID" className="input-field" />
                {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email address *</label>
                <input {...register('guestEmail')} type="email" placeholder="Confirmation sent here" className="input-field" />
                {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone number</label>
                <input {...register('guestPhone')} type="tel" placeholder="+61 4xx xxx xxx" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message to host (optional)</label>
                <textarea {...register('notes')} rows={3} placeholder="Let the host know anything useful..." className="input-field resize-none" />
              </div>

              <div className="border border-airbnb-border rounded-xl p-4 bg-airbnb-light text-sm text-airbnb-gray">
                <p className="font-medium text-airbnb-dark mb-1">House rules reminder</p>
                <ul className="space-y-1">
                  <li>✓ Check-in after 3:00 PM</li>
                  <li>✓ Check-out before 11:00 AM</li>
                  <li>✓ No smoking on the property</li>
                  <li>✓ Maximum {guests} guest{guests > 1 ? 's' : ''}</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
              >
                <Lock className="w-4 h-4" />
                {isSubmitting ? 'Redirecting to payment...' : 'Confirm and pay'}
              </button>
              <p className="text-xs text-center text-airbnb-gray">
                By continuing, you agree to our terms. Payments are processed securely via Stripe.
              </p>
            </form>
          </div>

          {/* Right: Booking summary */}
          <div>
            <div className="card p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">🏡 Figtree Nook</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-airbnb-gray">Check-in</span>
                  <span className="font-medium">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-airbnb-gray">Check-out</span>
                  <span className="font-medium">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-airbnb-gray">Guests</span>
                  <span className="font-medium">{guests} guest{guests > 1 ? 's' : ''}</span>
                </div>
              </div>

              {isLoading ? (
                <div className="mt-4 text-center text-airbnb-gray text-sm animate-pulse">Calculating price...</div>
              ) : priceData && (
                <div className="mt-6 border-t border-airbnb-border pt-4 space-y-2 text-sm">
                  <h3 className="font-semibold mb-3">Price breakdown</h3>
                  <div className="flex justify-between">
                    <span className="text-airbnb-gray">{formatCurrency(priceData.nightlyRate)} × {priceData.nights} nights</span>
                    <span>{formatCurrency(priceData.subtotal)}</span>
                  </div>
                  {priceData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{priceData.discountLabel}</span>
                      <span>−{formatCurrency(priceData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-airbnb-gray">Cleaning fee</span>
                    <span>{formatCurrency(priceData.cleaningFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-airbnb-border pt-3 mt-2">
                    <span>Total (AUD)</span>
                    <span>{formatCurrency(priceData.totalPrice)}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-airbnb-border flex items-center gap-2 text-xs text-airbnb-gray">
                <Lock className="w-3 h-3" />
                Secure payment via Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
