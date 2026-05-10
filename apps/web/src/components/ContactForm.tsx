'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, MessageCircle } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await sendMessage(data);
      setSubmitted(true);
      reset();
      toast.success('Message sent! We\'ll get back to you within an hour.');
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Message sent!</h3>
        <p className="text-airbnb-gray mb-4">Trang usually responds within an hour.</p>
        <button onClick={() => setSubmitted(false)} className="btn-secondary text-sm">Send another message</button>
      </div>
    );
  }

  return (
    <section id="contact" className="py-8">
      <h2 className="section-title flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        Message the host
      </h2>
      <p className="text-airbnb-gray text-sm mb-6">Have a question? Trang typically responds within an hour.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input {...register('name')} placeholder="Your name" className="input-field" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input {...register('email')} type="email" placeholder="your@email.com" className="input-field" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input {...register('phone')} type="tel" placeholder="+61 4xx xxx xxx" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject</label>
            <input {...register('subject')} placeholder="e.g. Booking inquiry" className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Message *</label>
          <textarea
            {...register('message')}
            rows={5}
            placeholder="Ask about availability, facilities, local tips..."
            className="input-field resize-none"
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </section>
  );
}
