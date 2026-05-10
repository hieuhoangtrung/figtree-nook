'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { Grid3X3 } from 'lucide-react';
import { property } from '@/lib/property';

export default function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const photos = property.photos;
  const slides = photos.map(p => ({ src: p.src, title: p.alt }));

  const openAt = (i: number) => { setIndex(i); setOpen(true); };

  return (
    <div className="relative">
      {/* Desktop Airbnb-style grid: 1 large left + 4 smaller right */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[480px]">
        {/* Main large photo — col 1+2, row 1+2 */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
          onClick={() => openAt(0)}
        >
          <Image
            src={photos[0].src}
            alt={photos[0].alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>

        {/* 4 smaller photos */}
        {photos.slice(1, 5).map((photo, i) => (
          <div
            key={i}
            className="relative cursor-pointer group overflow-hidden"
            onClick={() => openAt(i + 1)}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll of photos */}
      <div className="md:hidden flex gap-2 overflow-x-auto snap-x snap-mandatory rounded-2xl pb-1">
        {photos.slice(0, 6).map((photo, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 w-80 h-64 cursor-pointer snap-center rounded-xl overflow-hidden"
            onClick={() => openAt(i)}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="320px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Show all photos button */}
      <button
        onClick={() => openAt(0)}
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border border-airbnb-dark text-airbnb-dark text-sm font-semibold px-4 py-2 rounded-lg hover:bg-airbnb-light transition-colors shadow-sm"
      >
        <Grid3X3 className="w-4 h-4" />
        Show all {photos.length} photos
      </button>

      {/* Lightbox with captions and counter */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Captions, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
        captions={{ showToggle: true, descriptionTextAlign: 'center' }}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
      />
    </div>
  );
}
