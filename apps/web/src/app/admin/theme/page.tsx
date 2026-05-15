'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Palette, Type, Layout } from 'lucide-react';

interface ThemeConfig {
  id: string; primaryColor: string; accentColor: string; fontFamily: string;
  logoUrl?: string | null; heroHeadline: string; heroSubtext: string; footerText: string;
}

const FONTS = [
  { value: 'Inter', label: 'Inter (Modern, clean)' },
  { value: 'Georgia', label: 'Georgia (Elegant, serif)' },
  { value: 'system-ui', label: 'System UI (Native)' },
  { value: 'Arial', label: 'Arial (Classic)' },
];

const PRESET_COLORS = [
  { name: 'Airbnb Red', primary: '#FF385C', accent: '#222222' },
  { name: 'Ocean Blue', primary: '#0070F3', accent: '#003D99' },
  { name: 'Forest Green', primary: '#16a34a', accent: '#166534' },
  { name: 'Sunset Orange', primary: '#ea580c', accent: '#9a3412' },
  { name: 'Purple', primary: '#7c3aed', accent: '#4c1d95' },
  { name: 'Teal', primary: '#0d9488', accent: '#134e4a' },
];

export default function AdminThemePage() {
  const queryClient = useQueryClient();
  const { data: theme, isLoading } = useQuery<ThemeConfig>({
    queryKey: ['theme'],
    queryFn: () => api.get('/api/theme').then(r => r.data),
  });

  const [form, setForm] = useState({
    primaryColor: '#FF385C', accentColor: '#222222', fontFamily: 'Inter',
    logoUrl: '', heroHeadline: 'Figtree Nook', heroSubtext: 'Private Studio in convenient Figtree location',
    footerText: '© Figtree Nook · Figtree, NSW 2525, Australia',
  });

  useEffect(() => {
    if (theme) {
      setForm({
        primaryColor: theme.primaryColor, accentColor: theme.accentColor,
        fontFamily: theme.fontFamily, logoUrl: theme.logoUrl || '',
        heroHeadline: theme.heroHeadline, heroSubtext: theme.heroSubtext,
        footerText: theme.footerText,
      });
    }
  }, [theme]);

  const { mutate: saveTheme, isPending: saving } = useMutation({
    mutationFn: () => api.patch('/api/admin/theme', form).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme'] });
      toast.success('Theme updated! Changes will appear on the site.');
      // Apply immediately to admin UI
      document.documentElement.style.setProperty('--color-primary', form.primaryColor);
      document.documentElement.style.setProperty('--color-accent', form.accentColor);
    },
    onError: () => toast.error('Failed to save theme'),
  });

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setForm(f => ({ ...f, primaryColor: preset.primary, accentColor: preset.accent }));
  };

  if (isLoading) return <div className="text-center py-12 text-airbnb-gray animate-pulse">Loading theme...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Theme Customiser</h1>
          <p className="text-airbnb-gray text-sm mt-1">Personalise the look and feel of your booking website</p>
        </div>
        <button onClick={() => saveTheme()} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-airbnb-pink" />Colours</h2>

          {/* Presets */}
          <div>
            <p className="text-sm font-medium mb-2">Colour presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-airbnb-border hover:border-airbnb-dark transition-colors text-sm"
                  title={p.name}
                >
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: p.primary }} />
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.accent }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-12 h-12 rounded-xl border border-airbnb-border cursor-pointer" />
                <input type="text" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="input-field flex-1 font-mono text-sm" placeholder="#FF385C" />
              </div>
              <p className="text-xs text-airbnb-gray mt-1">Used for buttons, links, highlights</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Accent colour</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="w-12 h-12 rounded-xl border border-airbnb-border cursor-pointer" />
                <input type="text" value={form.accentColor} onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} className="input-field flex-1 font-mono text-sm" placeholder="#222222" />
              </div>
              <p className="text-xs text-airbnb-gray mt-1">Used for headings, dark elements</p>
            </div>
          </div>

          {/* Live preview */}
          <div className="border border-airbnb-border rounded-xl p-4 space-y-3">
            <p className="text-xs text-airbnb-gray font-medium uppercase tracking-wide">Preview</p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: form.primaryColor }}>Book Now</button>
              <button className="px-4 py-2 rounded-xl border-2 text-sm font-semibold" style={{ borderColor: form.accentColor, color: form.accentColor }}>Contact Host</button>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: form.primaryColor }} />
              <span className="text-sm" style={{ color: form.primaryColor }}>This is a primary link</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2"><Type className="w-5 h-5 text-airbnb-pink" />Typography</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Font family</label>
            <select value={form.fontFamily} onChange={e => setForm(f => ({ ...f, fontFamily: e.target.value }))} className="input-field">
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {/* Preview */}
            <div className="mt-3 p-4 border border-airbnb-border rounded-xl" style={{ fontFamily: form.fontFamily }}>
              <p className="text-xl font-bold mb-1">The quick brown fox</p>
              <p className="text-sm text-gray-500">jumps over the lazy dog — Figtree Nook</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-airbnb-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Layout className="w-5 h-5 text-airbnb-pink" />Site Content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Logo URL (optional)</label>
              <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} className="input-field" placeholder="https://example.com/logo.png" />
              <p className="text-xs text-airbnb-gray mt-1">Leave empty to use text logo</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Hero headline</label>
              <input value={form.heroHeadline} onChange={e => setForm(f => ({ ...f, heroHeadline: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Hero subtext</label>
              <input value={form.heroSubtext} onChange={e => setForm(f => ({ ...f, heroSubtext: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Footer text</label>
              <input value={form.footerText} onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))} className="input-field" />
            </div>
          </div>

          {/* Content preview */}
          <div className="border-2 border-dashed border-airbnb-border rounded-xl p-6 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: form.accentColor, fontFamily: form.fontFamily }}>{form.heroHeadline}</p>
            <p className="text-sm" style={{ fontFamily: form.fontFamily }}>{form.heroSubtext}</p>
            <p className="text-xs text-airbnb-gray mt-4">{form.footerText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
