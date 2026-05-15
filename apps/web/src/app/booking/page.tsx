'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BookingVerifyStep from '@/components/BookingVerifyStep';
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

function BookingPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = parseInt(params.get('guests') || '1');

  // Step 1: contact details, Step 2: OTP verify, Step 3: payment form
  const [step, setStep] = useState<'details' | 'verify' | 'payment'>('details');
  const [contactDetails, setContactDetails] = useState({ guestEmail: '', guestPhone: '' });

  const { data: priceData, isLoading } = useQuery({
    queryKey: ['price-preview', checkIn, checkOut, guests],
    queryFn: () => getPricePreview(checkIn, checkOut, guests),
    enabled: !!(checkIn && checkOut),
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchEmail = watch('guestEmail', '');
  const watchPhone = watch('guestPhone', '');

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

  // Step indicators
  const steps = [
    { key: 'details', label: 'Your details', num: 1 },
    { key: 'verify', label: 'Verify', num: 2 },
    { key: 'payment', label: 'Payment', num: 3 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium mb-8 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to listing
        </Link>

        <h1 className="text-2xl font-semibold mb-6">Confirm and pay</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === s.key ? 'bg-airbnb-dark text-white' :
                steps.findIndex(x => x.key === step) > i ? 'bg-green-500 text-white' :
                'bg-airbnb-border text-airbnb-gray'
              }`}>
                {steps.findIndex(x => x.key === step) > i ? '✓' : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === s.key ? 'text-airbnb-dark' : 'text-airbnb-gray'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-0.5 bg-airbnb-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Steps */}
          <div>
            {/* Step 1: Details */}
            {(step === 'details' || step === 'verify' || step === 'payment') && (
              <div className={step !== 'details' ? 'opacity-60 pointer-events-none' : ''}>
                <h2 className="text-xl font-semibold mb-6">Your details</h2>
                <div className="space-y-4">
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
                  {step === 'details' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!watchEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail)) {
                          toast.error('Please enter a valid email address');
                          return;
                        }
                        setContactDetails({ guestEmail: watchEmail, guestPhone: watchPhone || '' });
                        setStep('verify');
                      }}
                      className="btn-primary w-full py-4 text-base"
                    >
                      Continue to verification →
                    </button>
                  )}
                  {step !== 'details' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
                      <span>✅</span>
                      <span>Details saved — {watchEmail}</span>
                      <button onClick={() => setStep('details')} className="ml-auto text-xs underline text-airbnb-gray">Edit</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Verify */}
            {(step === 'verify' || step === 'payment') && (
              <div className={`mt-8 ${step === 'payment' ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-semibold mb-4">Verify your contact</h2>
                {step === 'verify' ? (
                  <BookingVerifyStep
                    email={contactDetails.guestEmail}
                    phone={contactDetails.guestPhone}
                    onVerified={() => setStep('payment')}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
                    <span>✅</span>
                    <span>Contact verified</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 'payment' && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Complete payment</h2>
                <div className="space-y-4">
                  <div className="border border-airbnb-border rounded-xl p-4 bg-airbnb-light text-sm text-airbnb-gray">
                    <p className="font-medium text-airbnb-dark mb-1">House rules reminder</p>
                    <ul className="space-y-1">
                      <li>✓ Check-in after 3:00 PM</li>
                      <li>✓ Check-out before 11:00 AM</li>
                      <li>✓ No smoking on the property</li>
                      <li>✓ Maximum {guests} guest{guests > 1 ? 's' : ''}</li>
                    </ul>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
                    >
                      <Lock className="w-4 h-4" />
                      {isSubmitting ? 'Redirecting to payment...' : 'Confirm and pay'}
                    </button>
                    <p className="text-xs text-center text-airbnb-gray mt-3">
                      By continuing, you agree to our terms. Payments are processed securely via Stripe.
                    </p>
                  </form>
                </div>
              </div>
            )}
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

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-airbnb-pink border-t-transparent rounded-full animate-spin" /></div>}>
      <BookingPageInner />
    </Suspense>
  );
}
