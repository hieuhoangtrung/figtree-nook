'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPricing, updatePricing, addDiscountRule, deleteDiscountRule } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['pricing'], queryFn: getPricing });

  const [pricingForm, setPricingForm] = useState<Record<string, string | number>>({});
  const [discountForm, setDiscountForm] = useState({ minNights: '', discountPercent: '', label: '' });

  const { mutate: savePricing, isPending: saving } = useMutation({
    mutationFn: () => updatePricing(pricingForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pricing'] }); toast.success('Pricing updated!'); setPricingForm({}); },
    onError: () => toast.error('Failed to update pricing'),
  });

  const { mutate: addDiscount, isPending: addingDiscount } = useMutation({
    mutationFn: () => addDiscountRule({
      minNights: parseInt(discountForm.minNights),
      discountPercent: parseFloat(discountForm.discountPercent),
      label: discountForm.label,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pricing'] }); toast.success('Discount rule added!'); setDiscountForm({ minNights: '', discountPercent: '', label: '' }); },
    onError: () => toast.error('Failed to add discount rule'),
  });

  const { mutate: removeDiscount } = useMutation({
    mutationFn: (id: string) => deleteDiscountRule(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pricing'] }); toast.success('Discount rule removed'); },
    onError: () => toast.error('Failed to remove discount rule'),
  });

  const pricing = data?.pricing;
  const discounts = data?.discounts || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pricing & Discounts</h1>
        <p className="text-airbnb-gray text-sm mt-1">Manage nightly rates, fees and long-stay discounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing config */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4">Base Pricing</h2>
          {isLoading ? <div className="animate-pulse text-airbnb-gray">Loading...</div> : (
            <div className="space-y-4">
              {[
                { key: 'nightlyRate', label: 'Nightly rate (AUD)', current: pricing?.nightlyRate },
                { key: 'weekendSurcharge', label: 'Weekend surcharge (AUD)', current: pricing?.weekendSurcharge },
                { key: 'cleaningFee', label: 'Cleaning fee (AUD)', current: pricing?.cleaningFee },
                { key: 'minNights', label: 'Minimum nights', current: pricing?.minNights },
                { key: 'maxNights', label: 'Maximum nights', current: pricing?.maxNights },
              ].map(({ key, label, current }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">{label}</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-airbnb-gray w-24">Current: {current}</span>
                    <input
                      type="number"
                      placeholder={`New value`}
                      value={pricingForm[key] || ''}
                      onChange={e => setPricingForm(f => ({ ...f, [key]: e.target.value }))}
                      className="input-field flex-1"
                      min="0"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => savePricing()}
                disabled={saving || Object.keys(pricingForm).length === 0}
                className="btn-primary flex items-center gap-2 text-sm py-2.5"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save pricing'}
              </button>
            </div>
          )}
        </div>

        {/* Discounts */}
        <div className="bg-white rounded-2xl border border-airbnb-border p-6">
          <h2 className="font-semibold mb-4">Long-Stay Discounts</h2>

          {/* Existing rules */}
          <div className="space-y-3 mb-6">
            {discounts.length === 0 ? (
              <p className="text-airbnb-gray text-sm">No discount rules configured.</p>
            ) : discounts.map((d: { id: string; label: string; minNights: number; discountPercent: number; active: boolean }) => (
              <div key={d.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-green-700">{d.minNights}+ nights → {d.discountPercent}% off</p>
                </div>
                <button
                  onClick={() => removeDiscount(d.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new rule */}
          <div className="border-t border-airbnb-border pt-4">
            <h3 className="text-sm font-semibold mb-3">Add Discount Rule</h3>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Minimum nights (e.g. 7)"
                value={discountForm.minNights}
                onChange={e => setDiscountForm(f => ({ ...f, minNights: e.target.value }))}
                className="input-field"
                min="1"
              />
              <input
                type="number"
                placeholder="Discount % (e.g. 10)"
                value={discountForm.discountPercent}
                onChange={e => setDiscountForm(f => ({ ...f, discountPercent: e.target.value }))}
                className="input-field"
                min="1" max="100"
              />
              <input
                type="text"
                placeholder="Label (e.g. Weekly discount)"
                value={discountForm.label}
                onChange={e => setDiscountForm(f => ({ ...f, label: e.target.value }))}
                className="input-field"
              />
              <button
                onClick={() => addDiscount()}
                disabled={!discountForm.minNights || !discountForm.discountPercent || !discountForm.label || addingDiscount}
                className="btn-primary flex items-center gap-2 text-sm py-2.5 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add discount rule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
