import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function BookingCancelledPage() {
  return (
    <div className="min-h-screen bg-airbnb-light flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Booking Cancelled</h1>
        <p className="text-airbnb-gray mb-8">
          Your booking was not completed. No payment was taken. Your dates are still available.
        </p>
        <div className="space-y-3">
          <Link href="/#booking" className="btn-primary inline-block w-full py-4">Try again</Link>
          <Link href="/#contact" className="btn-secondary inline-block w-full py-4">Contact the host</Link>
        </div>
      </div>
    </div>
  );
}
