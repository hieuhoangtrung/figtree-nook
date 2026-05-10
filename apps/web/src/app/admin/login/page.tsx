'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Home } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await adminLogin(data.email, data.password);
      localStorage.setItem('admin_token', result.token);
      router.push('/admin');
      toast.success(`Welcome back, ${result.admin.name}!`);
    } catch {
      toast.error('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-airbnb-light flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-airbnb-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Figtree Nook</h1>
          <p className="text-airbnb-gray mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="admin@figtreenook.com" className="input-field" autoFocus />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-airbnb-gray mt-6">
          <a href="/" className="hover:underline">← Back to listing</a>
        </p>
      </div>
    </div>
  );
}
