'use client';

import { useRef, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderType: 'GUEST' | 'HOST';
  content: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP' | 'BOTH';
  createdAt: string;
  readAt?: string | null;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  guestName: string;
  hostName?: string;
}

const channelIcon = (channel: string) => {
  if (channel === 'EMAIL') return <Mail className="w-3 h-3" />;
  if (channel === 'SMS') return <Phone className="w-3 h-3" />;
  return <MessageSquare className="w-3 h-3" />;
};

const channelLabel = (channel: string) => {
  if (channel === 'EMAIL') return 'Email';
  if (channel === 'SMS') return 'SMS';
  if (channel === 'BOTH') return 'Email + SMS';
  return 'In-app';
};

export default function ChatThread({ messages, guestName, hostName = 'Trang' }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-airbnb-gray text-sm">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[480px] overflow-y-auto px-1 py-2">
      {messages.map((msg) => {
        const isHost = msg.senderType === 'HOST';
        return (
          <div key={msg.id} className={cn('flex gap-3', isHost ? 'flex-row-reverse' : 'flex-row')}>
            {/* Avatar */}
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
              isHost ? 'bg-airbnb-pink' : 'bg-airbnb-dark'
            )}>
              {isHost ? hostName[0] : guestName[0]}
            </div>

            {/* Bubble */}
            <div className={cn('max-w-[75%] space-y-1', isHost ? 'items-end' : 'items-start', 'flex flex-col')}>
              <div className={cn(
                'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                isHost
                  ? 'bg-airbnb-dark text-white rounded-tr-sm'
                  : 'bg-airbnb-light text-airbnb-dark rounded-tl-sm border border-airbnb-border'
              )}>
                {msg.content}
              </div>
              <div className={cn('flex items-center gap-1.5 text-xs text-airbnb-gray px-1', isHost && 'flex-row-reverse')}>
                <span>{formatDate(msg.createdAt, 'd MMM, h:mm a')}</span>
                <span className="flex items-center gap-0.5 bg-gray-100 rounded px-1 py-0.5">
                  {channelIcon(msg.channel)}
                  <span>{channelLabel(msg.channel)}</span>
                </span>
                {isHost && msg.readAt && <span className="text-green-500">✓ Read</span>}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
