'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviews } from '@/lib/api';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Star, Trash2, Eye, EyeOff } from 'lucide-react';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ guestName: '', rating: '5', comment: '', reviewDate: '', source: 'airbnb', featured: false });

  const { data: reviews = [], isLoading } = useQuery({ queryKey: ['reviews'], queryFn: () => getReviews() });

  const { mutate: addReview, isPending: adding } = useMutation({
    mutationFn: () => api.post('/api/reviews', { ...form, rating: parseFloat(form.rating), featured: form.featured }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast.success('Review added!'); setForm({ guestName: '', rating: '5', comment: '', reviewDate: '', source: 'airbnb', featured: false }); setShowForm(false); },
    onError: () => toast.error('Failed to add review'),
  });

  const { mutate: toggleFeatured } = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => api.patch(`/api/reviews/${id}`, { featured }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const { mutate: deleteReview } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/reviews/${id}`).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast.success('Review deleted'); },
    onError: () => toast.error('Failed to delete review'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-airbnb-gray text-sm mt-1">{reviews.length} reviews · Showing on public listing</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" />
          Add review
        </button>
      </div>

      {/* Add review form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-airbnb-border p-6 mb-6">
          <h2 className="font-semibold mb-4">Add Review</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Guest name</label>
              <input type="text" value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} className="input-field" placeholder="Guest name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Rating (1-5)</label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Review date</label>
              <input type="date" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-field">
                <option value="airbnb">Airbnb</option>
                <option value="direct">Direct</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Review text</label>
              <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Guest review..." />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-airbnb-pink" />
              <label htmlFor="featured" className="text-sm font-medium">Feature on homepage</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addReview()} disabled={!form.guestName || !form.comment || !form.reviewDate || adding} className="btn-primary text-sm py-2 px-4">
              {adding ? 'Adding...' : 'Add review'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="bg-white rounded-2xl border border-airbnb-border overflow-hidden">
        {isLoading ? <div className="text-center py-12 text-airbnb-gray animate-pulse">Loading...</div> : (
          <div className="divide-y divide-airbnb-border">
            {reviews.map((r: { id: string; guestName: string; rating: number; comment: string; reviewDate: string; source: string; featured: boolean }) => (
              <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-airbnb-light transition-colors">
                <div className="w-10 h-10 rounded-full bg-airbnb-pink flex items-center justify-center text-white font-bold flex-shrink-0">
                  {r.guestName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{r.guestName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(r.rating) ? 'fill-airbnb-dark text-airbnb-dark' : 'text-airbnb-border'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-airbnb-gray">{formatDate(r.reviewDate, 'd MMM yyyy')}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.source}</span>
                    {r.featured && <span className="text-xs bg-airbnb-pink text-white px-1.5 py-0.5 rounded">Featured</span>}
                  </div>
                  <p className="text-sm text-airbnb-gray line-clamp-2">{r.comment}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleFeatured({ id: r.id, featured: !r.featured })} className={`p-2 rounded-lg transition-colors ${r.featured ? 'text-airbnb-pink hover:bg-pink-50' : 'text-airbnb-gray hover:bg-airbnb-light'}`} title={r.featured ? 'Unfeature' : 'Feature'}>
                    {r.featured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteReview(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
