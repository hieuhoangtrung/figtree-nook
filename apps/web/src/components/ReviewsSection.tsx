'use client';

import { useQuery } from '@tanstack/react-query';
import { getReviews } from '@/lib/api';
import { formatShortDate } from '@/lib/utils';
import { Star } from 'lucide-react';
import { property } from '@/lib/property';

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-airbnb-gray w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-airbnb-border rounded-full overflow-hidden">
        <div className="h-full bg-airbnb-dark rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-sm font-medium w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: { guestName: string; rating: number; comment: string; reviewDate: string | Date } }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-airbnb-pink flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {review.guestName[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{review.guestName}</p>
          <p className="text-xs text-airbnb-gray">{formatShortDate(review.reviewDate)}</p>
        </div>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < Math.round(review.rating) ? 'fill-airbnb-dark text-airbnb-dark' : 'text-airbnb-border'}`} />
        ))}
      </div>
      <p className="text-sm text-airbnb-dark leading-relaxed line-clamp-4">{review.comment}</p>
    </div>
  );
}

export default function ReviewsSection() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => getReviews(),
  });

  const rb = property.ratingBreakdown;

  return (
    <section id="reviews" className="py-8">
      {/* Overall rating */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 fill-current" />
          <span className="text-3xl font-bold">{property.rating}</span>
        </div>
        <div>
          <p className="font-semibold">Guest Favourite</p>
          <p className="text-sm text-airbnb-gray">One of the most loved homes on Airbnb</p>
        </div>
        <div className="ml-auto">
          <p className="text-3xl font-bold">{property.reviewCount}</p>
          <p className="text-sm text-airbnb-gray">Reviews</p>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <RatingBar label="Cleanliness" value={rb.cleanliness} />
        <RatingBar label="Accuracy" value={rb.accuracy} />
        <RatingBar label="Check-in" value={rb.checkIn} />
        <RatingBar label="Communication" value={rb.communication} />
        <RatingBar label="Location" value={rb.location} />
        <RatingBar label="Value" value={rb.value} />
      </div>

      <div className="divider" />

      {/* Review grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review: { id: string; guestName: string; rating: number; comment: string; reviewDate: string }) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-airbnb-gray text-sm">Loading reviews...</p>
      )}
    </section>
  );
}
