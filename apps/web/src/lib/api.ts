import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Add auth token for admin requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Pricing & availability
export const getAvailability = (start?: string, end?: string) =>
  api.get('/api/availability', { params: { start, end } }).then(r => r.data);

export const getPricing = () =>
  api.get('/api/pricing').then(r => r.data);

export const getPricePreview = (checkIn: string, checkOut: string, guests: number) =>
  api.get('/api/bookings/price-preview', { params: { checkIn, checkOut, guests } }).then(r => r.data);

// Bookings
export const createCheckout = (data: {
  guestName: string; guestEmail: string; guestPhone?: string;
  checkIn: string; checkOut: string; guests: number; notes?: string;
}) => api.post('/api/bookings/checkout', data).then(r => r.data);

export const getBookingBySession = (sessionId: string) =>
  api.get('/api/bookings/confirm', { params: { session_id: sessionId } }).then(r => r.data);

// Messages
export const sendMessage = (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
  api.post('/api/messages', data).then(r => r.data);

// Reviews
export const getReviews = (featured?: boolean) =>
  api.get('/api/reviews', { params: featured ? { featured: 'true' } : {} }).then(r => r.data);

// Admin
export const adminLogin = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password }).then(r => r.data);

export const getAdminDashboard = () =>
  api.get('/api/admin/dashboard').then(r => r.data);

export const getAdminBookings = (params?: { status?: string; page?: number }) =>
  api.get('/api/bookings', { params }).then(r => r.data);

export const updateBooking = (id: string, data: Record<string, unknown>) =>
  api.patch(`/api/bookings/${id}`, data).then(r => r.data);

export const getAdminMessages = (params?: { unread?: boolean }) =>
  api.get('/api/messages', { params }).then(r => r.data);

export const markMessageRead = (id: string) =>
  api.patch(`/api/messages/${id}/read`, { replied: true }).then(r => r.data);

export const getBlockedDates = () =>
  api.get('/api/availability/blocked').then(r => r.data);

export const blockDates = (data: { startDate: string; endDate: string; note?: string }) =>
  api.post('/api/availability/block', data).then(r => r.data);

export const unblockDates = (id: string) =>
  api.delete(`/api/availability/block/${id}`).then(r => r.data);

export const syncIcal = () =>
  api.post('/api/availability/sync-ical').then(r => r.data);

export const updatePricing = (data: Record<string, unknown>) =>
  api.patch('/api/pricing', data).then(r => r.data);

export const addDiscountRule = (data: { minNights: number; discountPercent: number; label: string }) =>
  api.post('/api/pricing/discounts', data).then(r => r.data);

export const deleteDiscountRule = (id: string) =>
  api.delete(`/api/pricing/discounts/${id}`).then(r => r.data);
