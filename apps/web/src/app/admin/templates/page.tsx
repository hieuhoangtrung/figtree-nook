'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Eye, EyeOff, Calendar, Mail, Clock } from 'lucide-react';

const TEMPLATE_TYPES = [
  { value: 'BOOKING_CONFIRM', label: 'Booking Confirmation', description: 'Sent when booking is paid', icon: '✅' },
  { value: 'PRE_ARRIVAL', label: 'Pre-arrival Instructions', description: 'Sent X hours before check-in', icon: '🗝️' },
  { value: 'CANCELLATION', label: 'Cancellation Notice', description: 'Sent when booking is cancelled', icon: '❌' },
  { value: 'RESCHEDULE_APPROVED', label: 'Reschedule Approved', description: 'Sent when reschedule is approved', icon: '📅' },
  { value: 'RESCHEDULE_DECLINED', label: 'Reschedule Declined', description: 'Sent when reschedule is declined', icon: '🚫' },
  { value: 'CUSTOM', label: 'Custom Template', description: 'Any custom message', icon: '✉️' },
];

const TEMPLATE_VARIABLES = [
  '{{guestName}}', '{{guestEmail}}', '{{checkIn}}', '{{checkOut}}',
  '{{nights}}', '{{guests}}', '{{totalPrice}}', '{{bookingId}}',
  '{{propertyName}}', '{{checkInTime}}', '{{checkOutTime}}', '{{siteUrl}}',
];

interface Template {
  id: string; name: string; type: string; subject: string;
  bodyHtml: string; bodySms?: string | null; active: boolean;
  preArrivalHours?: number | null; updatedAt: string;
}

const DEFAULT_PRE_ARRIVAL = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #FF385C;">🏡 Figtree Nook — Check-in Instructions</h2>
  <p>Hi {{guestName}},</p>
  <p>Your stay starts soon! Here's everything you need to know.</p>
  <h3>📅 Your booking</h3>
  <ul>
    <li><strong>Check-in:</strong> {{checkIn}} after {{checkInTime}}</li>
    <li><strong>Check-out:</strong> {{checkOut}} before {{checkOutTime}}</li>
    <li><strong>Guests:</strong> {{guests}}</li>
  </ul>
  <h3>🔑 Getting in</h3>
  <p>Check-in is <strong>self check-in</strong> via the key safe at the front door. The code will be sent separately.</p>
  <h3>🚗 Parking</h3>
  <p>Free parking is available on the driveway in front of the studio entrance.</p>
  <h3>🚿 Bathroom</h3>
  <p>The bathroom is located a few meters from the studio in the backyard — it's private and exclusively for your use.</p>
  <h3>📶 WiFi</h3>
  <p>Network and password are displayed on the welcome card inside the studio.</p>
  <p>If you have any questions, reply to this email or visit <a href="{{siteUrl}}/my-booking">your booking page</a>.</p>
  <p>Looking forward to welcoming you! 🌟<br><strong>Trang & Peter</strong><br>Figtree Nook</p>
</div>`;

const DEFAULT_CONFIRM = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #FF385C;">✅ Booking Confirmed — Figtree Nook</h2>
  <p>Hi {{guestName}}, your booking is confirmed!</p>
  <ul>
    <li><strong>Check-in:</strong> {{checkIn}} after 3:00 PM</li>
    <li><strong>Check-out:</strong> {{checkOut}} before 11:00 AM</li>
    <li><strong>Guests:</strong> {{guests}}</li>
    <li><strong>Total paid:</strong> {{totalPrice}}</li>
  </ul>
  <p>Manage your booking: <a href="{{siteUrl}}/my-booking">{{siteUrl}}/my-booking</a></p>
  <p>See you soon! — Trang 🏡</p>
</div>`;

export default function AdminTemplatesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'PRE_ARRIVAL', subject: '', bodyHtml: DEFAULT_PRE_ARRIVAL,
    bodySms: '', active: true, preArrivalHours: '48',
  });

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['admin-templates'],
    queryFn: () => api.get('/api/admin/templates').then(r => r.data),
  });

  const { mutate: saveTemplate, isPending: saving } = useMutation({
    mutationFn: () => editing
      ? api.patch(`/api/admin/templates/${editing.id}`, { ...form, preArrivalHours: form.preArrivalHours ? parseInt(form.preArrivalHours) : null }).then(r => r.data)
      : api.post('/api/admin/templates', { ...form, preArrivalHours: form.preArrivalHours ? parseInt(form.preArrivalHours) : null }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success(editing ? 'Template updated!' : 'Template created!');
      setEditing(null); setCreating(false);
    },
    onError: () => toast.error('Failed to save template'),
  });

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/templates/${id}`).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-templates'] }); toast.success('Template deleted'); },
    onError: () => toast.error('Failed to delete template'),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/api/admin/templates/${id}`, { active }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-templates'] }),
  });

  const startEdit = (t: Template) => {
    setEditing(t);
    setCreating(true);
    setForm({ name: t.name, type: t.type, subject: t.subject, bodyHtml: t.bodyHtml, bodySms: t.bodySms || '', active: t.active, preArrivalHours: String(t.preArrivalHours || 48) });
  };

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({ name: '', type: 'PRE_ARRIVAL', subject: 'Check-in Instructions — Figtree Nook', bodyHtml: DEFAULT_PRE_ARRIVAL, bodySms: '', active: true, preArrivalHours: '48' });
  };

  const insertVariable = (v: string) => setForm(f => ({ ...f, bodyHtml: f.bodyHtml + v }));

  if (creating) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => { setCreating(false); setEditing(null); }} className="text-sm text-airbnb-gray hover:text-airbnb-dark mb-2 flex items-center gap-1">← Back to templates</button>
            <h1 className="text-2xl font-bold">{editing ? 'Edit Template' : 'New Template'}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreview(!preview)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />{preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={() => saveTemplate()} disabled={saving || !form.name || !form.subject || !form.bodyHtml} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save template'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-airbnb-border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Template name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. Pre-arrival instructions" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, bodyHtml: e.target.value === 'BOOKING_CONFIRM' ? DEFAULT_CONFIRM : DEFAULT_PRE_ARRIVAL }))} className="input-field">
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              </div>
              {form.type === 'PRE_ARRIVAL' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-2"><Clock className="w-4 h-4" />Send X hours before check-in</label>
                  <input type="number" value={form.preArrivalHours} onChange={e => setForm(f => ({ ...f, preArrivalHours: e.target.value }))} className="input-field" min="1" max="168" />
                  <p className="text-xs text-airbnb-gray mt-1">e.g. 48 = 2 days before check-in</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Email subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Email body (HTML)</label>
                </div>
                <textarea
                  value={form.bodyHtml}
                  onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
                  rows={18}
                  className="input-field font-mono text-xs resize-y"
                  placeholder="Enter HTML email body..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SMS body (optional)</label>
                <textarea value={form.bodySms} onChange={e => setForm(f => ({ ...f, bodySms: e.target.value }))} rows={3} className="input-field resize-none text-sm" placeholder="Short SMS version (160 chars recommended)..." />
                <p className="text-xs text-airbnb-gray mt-1">{form.bodySms.length} chars</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Preview */}
            {preview && (
              <div className="bg-white rounded-2xl border border-airbnb-border p-4">
                <h3 className="font-semibold text-sm mb-3">Email preview</h3>
                <div className="border border-airbnb-border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={form.bodyHtml}
                    className="w-full h-64"
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {/* Variables */}
            <div className="bg-white rounded-2xl border border-airbnb-border p-4">
              <h3 className="font-semibold text-sm mb-3">Available variables</h3>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map(v => (
                  <button key={v} onClick={() => insertVariable(v)} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 font-mono transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-airbnb-gray mt-2">Click to insert at cursor position</p>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-airbnb-border p-4">
              <h3 className="font-semibold text-sm mb-3">Settings</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-200'}`} onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                  <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${form.active ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium">{form.active ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Message Templates</h1>
          <p className="text-airbnb-gray text-sm mt-1">Customise emails and SMS sent to guests automatically</p>
        </div>
        <button onClick={startCreate} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" />New template
        </button>
      </div>

      {/* Template type guide */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {TEMPLATE_TYPES.slice(0, 3).map(t => (
          <div key={t.value} className="bg-white rounded-xl border border-airbnb-border p-4">
            <p className="text-2xl mb-1">{t.icon}</p>
            <p className="font-medium text-sm">{t.label}</p>
            <p className="text-xs text-airbnb-gray">{t.description}</p>
          </div>
        ))}
      </div>

      {/* Templates list */}
      <div className="bg-white rounded-2xl border border-airbnb-border overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-airbnb-gray animate-pulse">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-3 text-airbnb-border" />
            <p className="font-medium mb-2">No templates yet</p>
            <p className="text-airbnb-gray text-sm mb-4">Create your first template to customise guest communications</p>
            <button onClick={startCreate} className="btn-primary text-sm py-2 px-4">Create pre-arrival template</button>
          </div>
        ) : (
          <div className="divide-y divide-airbnb-border">
            {templates.map(t => {
              const typeInfo = TEMPLATE_TYPES.find(tt => tt.value === t.type);
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-airbnb-light transition-colors">
                  <span className="text-2xl">{typeInfo?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{t.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{typeInfo?.label}</span>
                      {t.type === 'PRE_ARRIVAL' && t.preArrivalHours && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />{t.preArrivalHours}h before
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-airbnb-gray truncate">{t.subject}</p>
                    <p className="text-xs text-airbnb-gray">Updated {formatDate(t.updatedAt, 'd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive({ id: t.id, active: !t.active })} className={`p-2 rounded-lg transition-colors ${t.active ? 'text-green-600 hover:bg-green-50' : 'text-airbnb-gray hover:bg-airbnb-light'}`} title={t.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                      {t.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(t)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
