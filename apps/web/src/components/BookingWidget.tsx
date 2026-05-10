'use client';

import { useState, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { getAvailability, getPricePreview } from '@/lib/api';
import { formatCurrency, formatShortDate, toDateString } from '@/lib/utils';
import { ChevronDown, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseISO } from 'date-fns';
import { property } from '@/lib/property';

export default function BookingWidget() {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuests, setShowGuests] = useState(false);

  const { data: availData } = useQuery({
    queryKey: ['availability'],
    queryFn: () => getAvailability(
      toDateString(new Date()),
      toDateString(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
    ),
    staleTime: 5 * 60 * 1000,
  });

  const unavailableDates = (availData?.unavailable || []).map((d: string) => parseISO(d));

  const checkIn = range?.from ? toDateString(range.from) : undefined;
  const checkOut = range?.to ? toDateString(range.to) : undefined;
  const nights = range?.from && range?.to
    ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const { data: priceData } = useQuery({
    queryKey: ['price-preview', checkIn, checkOut, guests],
    queryFn: () => getPricePreview(checkIn!, checkOut!, guests),
    enabled: !!(checkIn && checkOut && nights > 0),
  });

  const handleBook = () => {
    if (!checkIn || !checkOut) {
      setShowCalendar(true);
      return;
    }
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    router.push(`/booking?${params.toString()}`);
  };

  return (
    <div id="booking" className="card p-6 sticky top-24 shadow-card">
      {/* Price header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-2xl font-bold">$120</span>
          <span className="text-airbnb-gray ml-1">AUD / night</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-semibold">{property.rating}</span>
          <span className="text-airbnb-gray">({property.reviewCount} reviews)</span>
        </div>
      </div>

      {/* Date & guest selector */}
      <div className="border border-airbnb-border rounded-xl overflow-hidden mb-3">
        {/* Check-in / Check-out */}
        <button
          className="w-full grid grid-cols-2 divide-x divide-airbnb-border"
          onClick={() => { setShowCalendar(!showCalendar); setShowGuests(false); }}
        >
          <div className="p-3 text-left hover:bg-airbnb-light transition-colors">
            <p className="text-xs font-bold uppercase tracking-wide">Check-in</p>
            <p className={`text-sm mt-0.5 ${range?.from ? 'text-airbnb-dark' : 'text-airbnb-gray'}`}>
              {range?.from ? formatShortDate(range.from) : 'Add date'}
            </p>
          </div>
          <div className="p-3 text-left hover:bg-airbnb-light transition-colors">
            <p className="text-xs font-bold uppercase tracking-wide">Check-out</p>
            <p className={`text-sm mt-0.5 ${range?.to ? 'text-airbnb-dark' : 'text-airbnb-gray'}`}>
              {range?.to ? formatShortDate(range.to) : 'Add date'}
            </p>
          </div>
        </button>

        {/* Guests */}
        <div className="border-t border-airbnb-border">
          <button
            className="w-full p-3 text-left hover:bg-airbnb-light transition-colors flex items-center justify-between"
            onClick={() => { setShowGuests(!showGuests); setShowCalendar(false); }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">Guests</p>
              <p className="text-sm mt-0.5">{guests} guest{guests > 1 ? 's' : ''}</p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showGuests ? 'rotate-180' : ''}`} />
          </button>

          {showGuests && (
            <div className="border-t border-airbnb-border p-4 flex items-center justify-between">
              <span className="font-medium">Guests (max {property.guests})</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-8 h-8 rounded-full border border-airbnb-border flex items-center justify-center hover:border-airbnb-dark transition-colors disabled:opacity-30"
                  disabled={guests <= 1}
                >−</button>
                <span className="w-6 text-center font-medium">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(property.guests, guests + 1))}
                  className="w-8 h-8 rounded-full border border-airbnb-border flex items-center justify-center hover:border-airbnb-dark transition-colors disabled:opacity-30"
                  disabled={guests >= property.guests}
                >+</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div className="mb-3 -mx-1">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => { setRange(r); if (r?.from && r?.to) setShowCalendar(false); }}
            disabled={[{ before: new Date() }, ...unavailableDates]}
            numberOfMonths={1}
            showOutsideDays={false}
            className="mx-auto"
          />
        </div>
      )}

      {/* Price breakdown */}
      {priceData && nights > 0 && (
        <div className="border-t border-airbnb-border pt-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="underline">{formatCurrency(priceData.nightlyRate)} × {nights} nights</span>
            <span>{formatCurrency(priceData.subtotal)}</span>
          </div>
          {priceData.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="underline">{priceData.discountLabel}</span>
              <span>−{formatCurrency(priceData.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="underline">Cleaning fee</span>
            <span>{formatCurrency(priceData.cleaningFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-airbnb-border pt-3 mt-2">
            <span>Total</span>
            <span>{formatCurrency(priceData.totalPrice)}</span>
          </div>
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={handleBook}
        className="btn-primary w-full text-base py-4 rounded-xl"
      >
        {range?.from && range?.to ? 'Reserve' : 'Check availability'}
      </button>

      {nights > 0 && (
        <p className="text-center text-sm text-airbnb-gray mt-3">You won't be charged yet</p>
      )}

      {/* Guest favourite badge */}
      <div className="mt-4 pt-4 border-t border-airbnb-border flex items-center justify-center gap-2 text-sm">
        <span>⭐</span>
        <span className="font-medium">Guest Favourite</span>
        <span className="text-airbnb-gray">· One of the most loved homes on Airbnb</span>
      </div>
    </div>
  );
}
