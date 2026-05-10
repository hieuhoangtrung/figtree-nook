'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminMessages, markMessageRead } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Mail, MailOpen, Trash2 } from 'lucide-react';

export default function AdminMessagesPage() {
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => getAdminMessages(),
    refetchInterval: 30000,
  });

  const { mutate: doRead } = useMutation({
    mutationFn: (id: string) => markMessageRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const messages = data?.messages || [];
  const unread = messages.filter((m: { read: boolean }) => !m.read).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-airbnb-gray text-sm mt-1">
          {unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'All messages read'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-airbnb-border overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-airbnb-gray animate-pulse">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-airbnb-gray">No messages yet.</div>
          ) : (
            <div className="divide-y divide-airbnb-border">
              {messages.map((m: Record<string, unknown>) => (
                <button
                  key={m.id as string}
                  onClick={() => { setSelected(m); if (!m.read) doRead(m.id as string); }}
                  className={`w-full text-left p-4 hover:bg-airbnb-light transition-colors ${selected?.id === m.id ? 'bg-airbnb-light' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {m.read ? <MailOpen className="w-4 h-4 text-airbnb-gray" /> : <Mail className="w-4 h-4 text-airbnb-pink" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!m.read ? 'font-semibold' : 'font-medium'} truncate`}>{m.name as string}</p>
                      <p className="text-xs text-airbnb-gray truncate">{m.subject as string || (m.message as string).slice(0, 40)}</p>
                      <p className="text-xs text-airbnb-gray mt-0.5">{formatDate(m.createdAt as string, 'd MMM yyyy')}</p>
                    </div>
                    {!m.read && <div className="w-2 h-2 rounded-full bg-airbnb-pink flex-shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-airbnb-border p-6">
          {!selected ? (
            <div className="flex items-center justify-center h-full min-h-48 text-airbnb-gray">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a message to read</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">{selected.name as string}</h2>
                  <p className="text-sm text-airbnb-gray">{selected.email as string}</p>
                  {selected.phone && <p className="text-sm text-airbnb-gray">{selected.phone as string}</p>}
                  <p className="text-xs text-airbnb-gray mt-1">{formatDate(selected.createdAt as string)}</p>
                </div>
              </div>
              {selected.subject && (
                <p className="font-medium text-sm mb-3">Subject: {selected.subject as string}</p>
              )}
              <div className="bg-airbnb-light rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed mb-6">
                {selected.message as string}
              </div>
              <a
                href={`mailto:${selected.email as string}?subject=Re: ${selected.subject || 'Your enquiry about Figtree Nook'}`}
                className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5"
              >
                <Mail className="w-4 h-4" />
                Reply via email
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
