'use client';

import { useState } from 'react';
import { Wifi, Car, Tv, Wind, Thermometer, Camera, Key, Briefcase, Trees, WashingMachine, X } from 'lucide-react';
import { property } from '@/lib/property';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, car: Car, tv: Tv, wind: Wind, thermometer: Thermometer,
  camera: Camera, key: Key, briefcase: Briefcase, tree: Trees,
  'washing-machine': WashingMachine,
};

export default function AmenitiesSection() {
  const [showAll, setShowAll] = useState(false);

  return (
    <section id="amenities" className="py-8">
      <h2 className="section-title">What this place offers</h2>

      {/* Top amenities grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {property.topAmenities.map((amenity) => {
          const Icon = iconMap[amenity.icon] || Wifi;
          return (
            <div key={amenity.label} className="flex items-center gap-4">
              <Icon className="w-6 h-6 text-airbnb-dark flex-shrink-0" />
              <span className="text-sm">{amenity.label}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAll(true)}
        className="btn-secondary text-sm"
      >
        Show all {property.amenities.reduce((acc, cat) => acc + cat.items.length, 0)} amenities
      </button>

      {/* Full amenities modal */}
      {showAll && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true">
          <div className="flex items-start justify-center min-h-screen pt-8 px-4 pb-8">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAll(false)} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">What this place offers</h3>
                <button onClick={() => setShowAll(false)} className="p-2 rounded-full hover:bg-airbnb-light transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                {property.amenities.map((category) => (
                  <div key={category.category}>
                    <h4 className="font-semibold text-base mb-3">{category.category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {category.items.map((item) => (
                        <div key={item} className="flex items-center gap-3 text-sm">
                          <span className="w-2 h-2 rounded-full bg-airbnb-dark flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
