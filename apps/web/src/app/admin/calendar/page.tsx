'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBlockedDates, blockDates, unblockDates, syncIcal } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Trash2, Lock } from 'lucide-react';

export default function AdminCalendarPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ startDate: '', endDate: '', note: '' });
  const [showForm, setShowForm] = useState(false);

  const { data: blocked = [], isLoading } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: getBlockedDates,
  });

  const { mutate: doSync, isPending: syncing } = useMutation({
    mutationFn: syncIcal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success(data.message || 'iCal synced!');
    },
    onError: () => toast.error('iCal sync failed. Check your AIRBNB_ICAL_URL setting.'),
  });

  const { mutate: doBlock, isPending: blocking } = useMutation({
    mutationFn: () => blockDates({ startDate: form.startDate, endDate: form.endDate, note: form.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Dates blocked successfully');
      setForm({ startDate: '', endDate: '', note: '' });
      setShowForm(false);
    },
    onError: () => toast.error('Failed to block dates'),
  });

  const { mutate: doUnblock } = useMutation({
    mutationFn: (id: string) => unblockDates(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Dates unblocked');
    },
    onError: () => toast.error('Failed to unblock dates'),
  });

  const manualBlocked = blocked.filter((b: { source: string }) => b.source === 'MANUAL');
  const icalBlocked = blocked.filter((b: { source: string }) => b.source === 'AIRBNB_ICAL');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar Management</h1>
          <p className="text-airbnb-gray text-sm mt-1">Block dates and sync with Airbnb</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => doSync()}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Airbnb iCal'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            Block dates
          </button>
        </div>
      </div>

      {/* Block dates form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-airbnb-border p-6 mb-6">
          <h2 className="font-semibold mb-4">Block Date Range</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="input-field"
                min={form.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g. Maintenance, Personal use"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => doBlock()}
              disabled={!form.startDate || !form.endDate || blocking}
              className="btn-primary text-sm py-2 px-4"
            >
              {blocking ? 'Blocking...' : 'Block dates'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual blocks */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-airbnb-pink" />
            Manual Blocks ({manualBlocked.length})
          </h2>
          {manualBlocked.length === 0 ? (
            <p className="text-airbnb-gray text-sm">No manual blocks.</p>
          ) : (
            <div className="space-y-3">
              {manualBlocked.map((b: { id: string; startDate: string; endDate: string; note?: string }) => (
                <div key={b.id} className="flex items-center justify-between border border-airbnb-border rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(b.startDate, 'd MMM yyyy')} → {formatDate(b.endDate, 'd MMM yyyy')}</p>
                    {b.note && <p className="text-xs text-airbnb-gray">{b.note}</p>}
                  </div>
                  <button
                    onClick={() => doUnblock(b.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Unblock"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Airbnb iCal blocks */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Airbnb iCal Blocks ({icalBlocked.length})
          </h2>
          <p className="text-xs text-airbnb-gray mb-4">Auto-synced from Airbnb every 4 hours. These cannot be manually deleted.</p>
          {icalBlocked.length === 0 ? (
            <p className="text-airbnb-gray text-sm">No Airbnb bookings synced yet. Click "Sync Airbnb iCal" above.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {icalBlocked.map((b: { id: string; startDate: string; endDate: string }) => (
                <div key={b.id} className="flex items-center justify-between border border-blue-100 bg-blue-50 rounded-xl p-3">
                  <p className="text-sm">{formatDate(b.startDate, 'd MMM yyyy')} → {formatDate(b.endDate, 'd MMM yyyy')}</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Airbnb</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
