'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import ChatThread, { ChatMessage } from '@/components/ChatThread';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Home, Calendar, Users, DollarSign, ArrowRight, MessageSquare,
  RefreshCw, X, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Send
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: 'Pending payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: RefreshCw },
};

interface Booking {
  id: string; guestName: string; guestEmail: string; guestPhone?: string | null;
  checkIn: string; checkOut: string; guests: number; nights: number;
  nightlyRate: number; cleaningFee: number; discountAmount: number; totalPrice: number;
  status: string; notes?: string | null; createdAt: string;
  rescheduleRequests: RescheduleRequest[];
}
interface RescheduleRequest {
  id: string; status: string; requestedCheckIn: string; requestedCheckOut: string;
  guestNote?: string | null; hostNote?: string | null; createdAt: string;
}
interface ConvMessage { id: string; senderType: 'GUEST' | 'HOST'; content: string; channel: string; createdAt: string; readAt?: string | null; }
interface Conversation { id: string; messages: ConvMessage[]; }

function MyBookingDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const email = searchParams.get('email') || '';

  const [activeTab, setActiveTab] = useState<'summary' | 'reschedule' | 'messages'>('summary');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleRange, setRescheduleRange] = useState<DateRange | undefined>();
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-booking', bookingId, email],
    queryFn: () => api.get('/api/my-booking', { params: { email, bookingId: bookingId.slice(-6) } }).then(r => r.data),
    enabled: !!(bookingId && email),
    retry: false,
  });

  const { data: convData, refetch: refetchMessages } = useQuery({
    queryKey: ['my-booking-messages', bookingId],
    queryFn: () => api.get(`/api/my-booking/${bookingId}/messages`, { params: { email } }).then(r => r.data),
    refetchInterval: activeTab === 'messages' ? 10000 : false,
  });

  const { mutate: doCancel, isPending: cancelling } = useMutation({
    mutationFn: () => api.post(`/api/my-booking/${bookingId}/cancel`, { email, reason: cancelReason }).then(r => r.data),
    onSuccess: () => { toast.success('Booking cancelled'); setCancelOpen(false); queryClient.invalidateQueries({ queryKey: ['my-booking'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to cancel'),
  });

  const { mutate: doReschedule, isPending: rescheduling } = useMutation({
    mutationFn: () => api.post(`/api/my-booking/${bookingId}/reschedule`, {
      email, guestNote: rescheduleNote,
      requestedCheckIn: rescheduleRange?.from?.toISOString(),
      requestedCheckOut: rescheduleRange?.to?.toISOString(),
    }).then(r => r.data),
    onSuccess: () => { toast.success('Reschedule request sent!'); setRescheduleRange(undefined); queryClient.invalidateQueries({ queryKey: ['my-booking'] }); setActiveTab('summary'); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to request reschedule'),
  });

  const { mutate: doMessage, isPending: messaging } = useMutation({
    mutationFn: () => api.post(`/api/my-booking/${bookingId}/message`, { email, name: data?.booking?.guestName, content: newMessage }).then(r => r.data),
    onSuccess: () => { setNewMessage(''); refetchMessages(); toast.success('Message sent!'); },
    onError: () => toast.error('Failed to send message'),
  });

  if (!email) { router.push('/my-booking'); return null; }
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-airbnb-pink border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-airbnb-gray mb-4">Booking not found. Please check your details.</p>
        <Link href="/my-booking" className="btn-primary inline-block">Try again</Link>
      </div>
    </div>
  );

  const booking: Booking = data.booking;
  const StatusIcon = statusConfig[booking.status]?.icon || Clock;
  const pendingReschedule = booking.rescheduleRequests?.find(r => r.status === 'PENDING');
  const convMessages: ChatMessage[] = (convData?.conversation?.messages || []).map((m: ConvMessage) => ({ ...m, channel: m.channel as ChatMessage['channel'] }));
  const canCancel = ['CONFIRMED', 'PENDING'].includes(booking.status);
  const canReschedule = ['CONFIRMED', 'PENDING'].includes(booking.status) && !pendingReschedule;

  return (
    <div className="min-h-screen bg-airbnb-light">
      <header className="bg-white border-b border-airbnb-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-airbnb-pink font-bold text-lg">
            <Home className="w-5 h-5" />Figtree Nook
          </Link>
          <Link href="/my-booking" className="text-sm text-airbnb-gray hover:text-airbnb-dark">← All bookings</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Status header */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[booking.status]?.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig[booking.status]?.label}
                </span>
              </div>
              <h1 className="text-xl font-bold mt-2">Booking #{booking.id.slice(-8).toUpperCase()}</h1>
              <p className="text-airbnb-gray text-sm">Booked on {formatDate(booking.createdAt)}</p>
            </div>
            {canCancel && (
              <button onClick={() => setCancelOpen(true)} className="btn-secondary text-sm py-2 px-4 text-red-600 border-red-200 hover:bg-red-50">
                Cancel booking
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-airbnb-border">
            {[
              { key: 'summary', label: 'Summary', icon: Calendar },
              { key: 'reschedule', label: 'Change dates', icon: RefreshCw },
              { key: 'messages', label: `Messages${convMessages.filter(m => m.senderType === 'HOST' && !m.readAt).length ? ` (${convMessages.filter(m => m.senderType === 'HOST' && !m.readAt).length})` : ''}`, icon: MessageSquare },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-airbnb-dark text-airbnb-dark' : 'border-transparent text-airbnb-gray hover:text-airbnb-dark'}`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
              <h2 className="font-semibold">Stay details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-airbnb-pink flex-shrink-0" /><div><p className="font-medium">{formatDate(booking.checkIn)}</p><p className="text-airbnb-gray">Check-in after 3:00 PM</p></div></div>
                <div className="flex items-center gap-3"><ArrowRight className="w-4 h-4 text-airbnb-pink flex-shrink-0" /><div><p className="font-medium">{formatDate(booking.checkOut)}</p><p className="text-airbnb-gray">Check-out before 11:00 AM</p></div></div>
                <div className="flex items-center gap-3"><Users className="w-4 h-4 text-airbnb-pink flex-shrink-0" /><p>{booking.guests} guest{booking.guests > 1 ? 's' : ''} · {booking.nights} night{booking.nights > 1 ? 's' : ''}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
              <h2 className="font-semibold">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-airbnb-gray">{formatCurrency(booking.nightlyRate)} × {booking.nights} nights</span><span>{formatCurrency(booking.nightlyRate * booking.nights)}</span></div>
                {booking.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(booking.discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-airbnb-gray">Cleaning fee</span><span>{formatCurrency(booking.cleaningFee)}</span></div>
                <div className="flex justify-between font-bold border-t border-airbnb-border pt-2 mt-2"><span>Total</span><span>{formatCurrency(booking.totalPrice)}</span></div>
              </div>
            </div>
            {/* Reschedule request status */}
            {pendingReschedule && (
              <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="font-semibold text-amber-800 mb-2">⏳ Reschedule request pending</p>
                <p className="text-sm text-amber-700">Requested: {formatDate(pendingReschedule.requestedCheckIn)} → {formatDate(pendingReschedule.requestedCheckOut)}</p>
                {pendingReschedule.guestNote && <p className="text-sm text-amber-700 mt-1">Your note: {pendingReschedule.guestNote}</p>}
                <p className="text-xs text-amber-600 mt-2">The host will review your request and respond shortly.</p>
              </div>
            )}
            {booking.rescheduleRequests?.filter(r => r.status !== 'PENDING').map(r => (
              <div key={r.id} className={`md:col-span-2 rounded-2xl p-5 border ${r.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-semibold mb-1">{r.status === 'APPROVED' ? '✅' : '❌'} Reschedule request {r.status.toLowerCase()}</p>
                {r.hostNote && <p className="text-sm text-airbnb-gray">Host note: {r.hostNote}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Reschedule tab */}
        {activeTab === 'reschedule' && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            {!canReschedule ? (
              <div className="text-center py-8 text-airbnb-gray">
                {pendingReschedule
                  ? <p>You already have a pending reschedule request.</p>
                  : <p>This booking cannot be rescheduled.</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="font-semibold mb-2">Request new dates</h2>
                  <p className="text-sm text-airbnb-gray mb-4">Select your preferred check-in and check-out dates. The host will review and respond within 24 hours.</p>
                  <div className="flex justify-center">
                    <DayPicker
                      mode="range" selected={rescheduleRange} onSelect={setRescheduleRange}
                      disabled={[{ before: new Date() }]} numberOfMonths={1} showOutsideDays={false}
                    />
                  </div>
                </div>
                {rescheduleRange?.from && rescheduleRange?.to && (
                  <div className="bg-airbnb-light rounded-xl p-4 text-sm">
                    <p className="font-medium mb-1">Requested dates:</p>
                    <p>{formatDate(rescheduleRange.from)} → {formatDate(rescheduleRange.to)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Note to host (optional)</label>
                  <textarea value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)} rows={3} placeholder="Explain why you'd like to change dates..." className="input-field resize-none" />
                </div>
                <button
                  onClick={() => doReschedule()}
                  disabled={!rescheduleRange?.from || !rescheduleRange?.to || rescheduling}
                  className="btn-primary w-full py-4"
                >
                  {rescheduling ? 'Submitting...' : 'Request reschedule'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Messages tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Messages with Trang</h2>
            <div className="border border-airbnb-border rounded-xl p-4 mb-4 min-h-48">
              <ChatThread messages={convMessages} guestName={booking.guestName} />
            </div>
            <div className="flex gap-3">
              <textarea
                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Write a message to the host..."
                rows={2} className="input-field flex-1 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newMessage.trim()) doMessage(); } }}
              />
              <button onClick={() => doMessage()} disabled={!newMessage.trim() || messaging} className="btn-primary px-4 self-end py-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                {messaging ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-airbnb-gray mt-2">Press Enter to send, Shift+Enter for new line. Trang typically responds within an hour.</p>
          </div>
        )}
      </main>

      {/* Cancel modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setCancelOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <button onClick={() => setCancelOpen(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-airbnb-light"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-semibold mb-2">Cancel booking</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ Before you cancel</p>
              <p>Please contact the host directly to discuss cancellation and refund terms. Cancellations may not be refundable.</p>
            </div>
            <label className="block text-sm font-medium mb-1.5">Reason for cancellation</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Tell us why you're cancelling..." className="input-field resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setCancelOpen(false)} className="btn-secondary flex-1 py-3">Keep booking</button>
              <button onClick={() => doCancel()} disabled={cancelling} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Cancel booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookingDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-airbnb-pink border-t-transparent rounded-full animate-spin" /></div>}>
      <MyBookingDetailInner />
    </Suspense>
  );
}
