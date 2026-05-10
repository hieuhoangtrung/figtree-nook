import Navbar from '@/components/Navbar';
import PhotoGallery from '@/components/PhotoGallery';
import BookingWidget from '@/components/BookingWidget';
import AmenitiesSection from '@/components/AmenitiesSection';
import ReviewsSection from '@/components/ReviewsSection';
import ContactForm from '@/components/ContactForm';
import { property } from '@/lib/property';
import { Star, Shield, MapPin, Users, BedDouble, Bath } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">{property.tagline}</h1>

        {/* Photo Gallery */}
        <PhotoGallery />

        {/* Main Content + Booking Widget */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left column */}
          <div className="lg:col-span-2">
            {/* Property summary */}
            <section id="about">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Entire guest suite in Figtree, Australia</h2>
                  <div className="flex items-center gap-2 mt-1 text-airbnb-gray text-sm flex-wrap">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{property.guests} guests</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{property.bedrooms} bedroom</span>
                    <span>·</span>
                    <span>{property.beds} beds</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.baths} bath</span>
                  </div>
                </div>
                {/* Host avatar */}
                <div className="flex-shrink-0 ml-4">
                  <div className="w-14 h-14 rounded-full bg-airbnb-pink flex items-center justify-center text-white text-2xl font-bold">T</div>
                </div>
              </div>

              {/* Guest favourite badge */}
              <div className="mt-4 flex items-center gap-4 p-4 border border-airbnb-border rounded-xl">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold">Guest favourite</p>
                  <p className="text-sm text-airbnb-gray">One of the most loved homes on Airbnb, according to guests</p>
                </div>
                <div className="ml-auto text-right hidden sm:block">
                  <div className="flex items-center gap-1 font-semibold">
                    <Star className="w-4 h-4 fill-current" />
                    {property.rating}
                  </div>
                  <p className="text-sm text-airbnb-gray">{property.reviewCount} reviews</p>
                </div>
              </div>

              <div className="divider" />

              {/* Host info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-airbnb-pink flex items-center justify-center text-white font-bold text-lg">T</div>
                <div>
                  <p className="font-semibold">Hosted by {property.host.name}</p>
                  <p className="text-sm text-airbnb-gray">
                    {property.host.isSuperhost ? '⭐ Superhost · ' : ''}{property.host.yearsHosting} years hosting
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-5 mb-6">
                {property.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{h.icon}</span>
                    <div>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-sm text-airbnb-gray">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              {/* Description */}
              <div className="mb-6">
                <p className="text-airbnb-dark leading-relaxed whitespace-pre-line">{property.description}</p>
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">Studio Features:</h3>
                  <ul className="space-y-1.5">
                    {property.studioFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-airbnb-dark">
                        <span className="text-airbnb-pink mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">Location Highlights:</h3>
                  <ul className="space-y-1.5">
                    {property.locationHighlights.map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-airbnb-dark">
                        <MapPin className="w-4 h-4 text-airbnb-pink flex-shrink-0 mt-0.5" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="divider" />
            </section>

            {/* Sleeping arrangement */}
            <section className="py-4">
              <h2 className="section-title">Where you'll sleep</h2>
              <div className="border border-airbnb-border rounded-2xl p-6 inline-block">
                <span className="text-4xl">🛏️</span>
                <p className="font-semibold mt-3">Private studio</p>
                <p className="text-sm text-airbnb-gray mt-1">1 queen bed, 1 sofa bed</p>
              </div>
              <div className="divider" />
            </section>

            {/* Amenities */}
            <AmenitiesSection />
            <div className="divider" />

            {/* Reviews */}
            <ReviewsSection />
            <div className="divider" />

            {/* Location */}
            <section id="location" className="py-8">
              <h2 className="section-title">Where you'll be</h2>
              <p className="text-airbnb-gray mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Figtree, New South Wales, Australia
              </p>
              {/* Google Maps embed */}
              <div className="rounded-2xl overflow-hidden h-64 bg-gray-100 border border-airbnb-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3274.9!2d150.8600!3d-34.4500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b131c2e9e5b5555%3A0x0!2sFigtree%20NSW%202525!5e0!3m2!1sen!2sau!4v1620000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Figtree Nook location"
                />
              </div>
              <p className="text-sm text-airbnb-gray mt-3">📍 Exact location provided after booking.</p>
              <div className="divider" />
            </section>

            {/* Meet the host */}
            <section className="py-4">
              <h2 className="section-title">Meet your host</h2>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-airbnb-pink flex items-center justify-center text-white text-2xl font-bold">T</div>
                  <p className="text-center text-sm font-medium mt-2">{property.host.name}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-airbnb-pink" />
                    <span className="text-sm font-medium text-airbnb-pink">Superhost</span>
                  </div>
                  <p className="text-sm text-airbnb-gray leading-relaxed">{property.host.bio}</p>
                  <div className="mt-4 space-y-2 text-sm text-airbnb-gray">
                    <p>✓ Response rate: {property.host.responseRate}%</p>
                    <p>✓ Responds {property.host.responseTime}</p>
                    <p>✓ {property.host.yearsHosting} years hosting</p>
                  </div>
                </div>
              </div>
              <div className="divider" />
            </section>

            {/* Things to know */}
            <section className="py-4">
              <h2 className="section-title">Things to know</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold mb-3">House rules</h3>
                  <ul className="space-y-2 text-sm text-airbnb-gray">
                    <li>Check-in after {property.checkIn}</li>
                    <li>Checkout before {property.checkOut}</li>
                    <li>{property.guests} guests maximum</li>
                    <li>No smoking</li>
                    <li>Pets allowed</li>
                    <li>Long-term stays allowed</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Safety & property</h3>
                  <ul className="space-y-2 text-sm text-airbnb-gray">
                    <li>Smoke alarm installed</li>
                    <li>Security cameras on exterior</li>
                    <li>No carbon monoxide alarm</li>
                    <li>Self check-in via key safe</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Cancellation policy</h3>
                  <p className="text-sm text-airbnb-gray">Please contact the host to discuss cancellation terms. We recommend booking early to secure your dates.</p>
                </div>
              </div>
              <div className="divider" />
            </section>

            {/* Contact form */}
            <ContactForm />
          </div>

          {/* Right column — Booking widget */}
          <div className="lg:col-span-1">
            <BookingWidget />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-airbnb-border bg-airbnb-light mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-airbnb-gray">
            <p>© {new Date().getFullYear()} Figtree Nook · Figtree, NSW 2525, Australia · {property.pid}</p>
            <div className="flex gap-6">
              <a href="#booking" className="hover:text-airbnb-dark transition-colors">Book now</a>
              <a href="#contact" className="hover:text-airbnb-dark transition-colors">Contact</a>
              <a href="/admin" className="hover:text-airbnb-dark transition-colors">Admin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
