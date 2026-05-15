'use client';

import Link from 'next/link';

import { useState } from 'react';
import { Menu, X, Home } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-airbnb-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-airbnb-pink font-bold text-xl">
            <Home className="w-6 h-6" />
            <span className="hidden sm:block">Figtree Nook</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">About</a>
            <a href="#amenities" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">Amenities</a>
            <a href="#reviews" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">Reviews</a>
            <a href="#location" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">Location</a>
            <a href="#contact" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">Contact</a>
            <Link href="/my-booking" className="text-sm font-medium text-airbnb-gray hover:text-airbnb-dark transition-colors">My Booking</Link>
            <a
              href="#booking"
              className="btn-primary text-sm py-2 px-5"
            >
              Book Now
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-airbnb-light transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-airbnb-border bg-white px-4 py-4 flex flex-col gap-4">
          <a href="#about" className="text-sm font-medium py-2" onClick={() => setOpen(false)}>About</a>
          <a href="#amenities" className="text-sm font-medium py-2" onClick={() => setOpen(false)}>Amenities</a>
          <a href="#reviews" className="text-sm font-medium py-2" onClick={() => setOpen(false)}>Reviews</a>
          <a href="#location" className="text-sm font-medium py-2" onClick={() => setOpen(false)}>Location</a>
          <a href="#contact" className="text-sm font-medium py-2" onClick={() => setOpen(false)}>Contact</a>
          <a href="#booking" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>Book Now</a>
        </div>
      )}
    </nav>
  );
}
