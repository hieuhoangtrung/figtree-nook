import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Figtree Nook — Private Studio in Figtree, NSW',
  description: 'Comfortable private studio in Figtree, NSW. 3 guests · 1 bedroom · 2 beds · 1 bath. WiFi, AC, free parking, TV/Netflix. Book direct and save.',
  keywords: 'Figtree studio, Wollongong accommodation, short stay, holiday rental, NSW, Australia',
  openGraph: {
    title: 'Figtree Nook — Private Studio in Figtree, NSW',
    description: 'Comfortable private studio in Figtree, NSW. Book direct and save.',
    type: 'website',
    locale: 'en_AU',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-airbnb-dark antialiased">
        <Providers>
          {children}
          <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />
        </Providers>
      </body>
    </html>
  );
}
