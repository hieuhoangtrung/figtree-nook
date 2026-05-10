'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Grid3X3 } from 'lucide-react';
import { property } from '@/lib/property';

export default function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const photos = property.photos;
  const slides = photos.map(p => ({ src: p.src }));

  return (
    <div className="relative">
      {/* Desktop grid (Airbnb-style) */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[480px]">
        {/* Main large photo */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => { setIndex(0); setOpen(true); }}
        >
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-6xl">🏡</span>
          </div>
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>

        {/* 4 smaller photos */}
        {photos.slice(1, 5).map((photo, i) => (
          <div
            key={i}
            className="relative cursor-pointer group bg-gray-200 flex items-center justify-center"
            onClick={() => { setIndex(i + 1); setOpen(true); }}
          >
            <span className="text-gray-400 text-4xl">📷</span>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Mobile single photo */}
      <div
        className="md:hidden relative h-64 bg-gray-200 flex items-center justify-center cursor-pointer rounded-2xl"
        onClick={() => { setIndex(0); setOpen(true); }}
      >
        <span className="text-gray-400 text-6xl">🏡</span>
      </div>

      {/* Show all photos button */}
      <button
        onClick={() => { setIndex(0); setOpen(true); }}
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border border-airbnb-dark text-airbnb-dark text-sm font-semibold px-4 py-2 rounded-lg hover:bg-airbnb-light transition-colors shadow-sm"
      >
        <Grid3X3 className="w-4 h-4" />
        Show all photos
      </button>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
      />
    </div>
  );
}
