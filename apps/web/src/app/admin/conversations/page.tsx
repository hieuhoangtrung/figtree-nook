'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import ChatThread, { ChatMessage } from '@/components/ChatThread';
import toast from 'react-hot-toast';
import { MessageSquare, Send, Mail, Phone, Smartphone, RefreshCw } from 'lucide-react';

interface Conversation {
  id: string; guestName: string; guestEmail: string; guestPhone?: string | null;
  updatedAt: string; bookingId?: string | null;
  messages: { id: string; content: string; senderType: string; createdAt: string }[];
  _count: { messages: number };
  booking?: { id: string; status: string; checkIn: string; checkOut: string } | null;
}

const CHANNEL_OPTIONS = [
  { value: 'IN_APP', label: 'In-app only', icon: MessageSquare },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'SMS', label: 'SMS', icon: Phone },
  { value: 'BOTH', label: 'Email + SMS', icon: Smartphone },
];

export default function AdminConversationsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [channel, setChannel] = useState('IN_APP');
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newConv, setNewConv] = useState({ guestEmail: '', guestName: '', guestPhone: '', content: '', channel: 'EMAIL' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => api.get('/api/admin/conversations').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: threadData, refetch: refetchThread } = useQuery({
    queryKey: ['admin-conversation-thread', selected],
    queryFn: () => api.get(`/api/admin/conversations/${selected}/messages`).then(r => r.data),
    enabled: !!selected,
    refetchInterval: selected ? 10000 : false,
  });

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: () => api.post(`/api/admin/conversations/${selected}/reply`, { content: replyText, channel }).then(r => r.data),
    onSuccess: () => { setReplyText(''); refetchThread(); queryClient.invalidateQueries({ queryKey: ['admin-conversations'] }); toast.success('Reply sent!'); },
    onError: () => toast.error('Failed to send reply'),
  });

  const { mutate: startConv, isPending: starting } = useMutation({
    mutationFn: () => api.post('/api/admin/conversations', newConv).then(r => r.data),
    onSuccess: (data) => {
      toast.success('Conversation started!');
      setNewConvOpen(false);
      setNewConv({ guestEmail: '', guestName: '', guestPhone: '', content: '', channel: 'EMAIL' });
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
      setSelected(data.conversation.id);
    },
    onError: () => toast.error('Failed to start conversation'),
  });

  const conversations: Conversation[] = data?.conversations || [];
  const thread = threadData;
  const messages: ChatMessage[] = (thread?.messages || []).map((m: { id: string; senderType: string; content: string; channel: string; createdAt: string; readAt?: string | null }) => ({
    ...m,
    senderType: m.senderType as 'GUEST' | 'HOST',
    channel: m.channel as ChatMessage['channel'],
  }));
  const selectedConv = conversations.find(c => c.id === selected);
  const unreadCount = conversations.reduce((sum, c) => sum + c._count.messages, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Conversations
            {unreadCount > 0 && <span className="w-6 h-6 bg-airbnb-pink text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
          </h1>
          <p className="text-airbnb-gray text-sm mt-1">Communicate with guests across email, SMS, and in-app</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-sm py-2 px-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
          <button onClick={() => setNewConvOpen(true)} className="btn-primary text-sm py-2 px-4">
            + New message
          </button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-airbnb-border overflow-hidden flex flex-col">
          <div className="p-3 border-b border-airbnb-border text-xs font-semibold text-airbnb-gray uppercase tracking-wide">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-airbnb-border">
            {isLoading ? (
              <div className="p-4 text-center text-airbnb-gray text-sm animate-pulse">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-airbnb-gray text-sm">No conversations yet</div>
            ) : conversations.map((conv) => {
              const lastMsg = conv.messages[0];
              const hasUnread = conv._count.messages > 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={`w-full text-left p-4 hover:bg-airbnb-light transition-colors ${selected === conv.id ? 'bg-airbnb-light border-l-2 border-airbnb-pink' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-airbnb-dark flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {conv.guestName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-medium'}`}>{conv.guestName}</p>
                        {hasUnread && <span className="w-2 h-2 bg-airbnb-pink rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-airbnb-gray truncate">{lastMsg?.content || 'No messages'}</p>
                      <p className="text-xs text-airbnb-gray mt-0.5">{formatDate(conv.updatedAt, 'd MMM, h:mm a')}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 bg-white rounded-2xl border border-airbnb-border flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-airbnb-gray">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-airbnb-border flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedConv?.guestName}</p>
                  <p className="text-sm text-airbnb-gray">{selectedConv?.guestEmail} {selectedConv?.guestPhone ? `· ${selectedConv.guestPhone}` : ''}</p>
                  {selectedConv?.booking && (
                    <a href={`/admin/bookings`} className="text-xs text-airbnb-pink hover:underline">
                      Booking: {formatDate(selectedConv.booking.checkIn, 'd MMM')} → {formatDate(selectedConv.booking.checkOut, 'd MMM')} · {selectedConv.booking.status}
                    </a>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <ChatThread messages={messages} guestName={selectedConv?.guestName || 'Guest'} />
              </div>

              {/* Reply box */}
              <div className="border-t border-airbnb-border p-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {CHANNEL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setChannel(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${channel === opt.value ? 'bg-airbnb-dark text-white border-airbnb-dark' : 'border-airbnb-border text-airbnb-gray hover:border-airbnb-dark'}`}
                    >
                      <opt.icon className="w-3 h-3" />{opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2} className="input-field flex-1 resize-none"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (replyText.trim()) sendReply(); } }}
                  />
                  <button onClick={() => sendReply()} disabled={!replyText.trim() || sending} className="btn-primary px-4 self-end py-3 flex items-center gap-2">
                    <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {newConvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setNewConvOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold">New message to guest</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Guest name *</label><input value={newConv.guestName} onChange={e => setNewConv(n => ({ ...n, guestName: e.target.value }))} className="input-field" placeholder="John Smith" /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input value={newConv.guestEmail} onChange={e => setNewConv(n => ({ ...n, guestEmail: e.target.value }))} className="input-field" placeholder="john@example.com" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input value={newConv.guestPhone} onChange={e => setNewConv(n => ({ ...n, guestPhone: e.target.value }))} className="input-field" placeholder="+61412..." /></div>
              <div><label className="block text-sm font-medium mb-1">Send via</label>
                <select value={newConv.channel} onChange={e => setNewConv(n => ({ ...n, channel: e.target.value }))} className="input-field">
                  {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Message *</label><textarea value={newConv.content} onChange={e => setNewConv(n => ({ ...n, content: e.target.value }))} rows={4} className="input-field resize-none" placeholder="Hi, this is Trang from Figtree Nook..." /></div>
            <div className="flex gap-3">
              <button onClick={() => setNewConvOpen(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button onClick={() => startConv()} disabled={!newConv.guestName || !newConv.guestEmail || !newConv.content || starting} className="btn-primary flex-1 py-3">{starting ? 'Sending...' : 'Send message'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
