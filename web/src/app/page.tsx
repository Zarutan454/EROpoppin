import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Star, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-black h-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        >
          <source src="/locales/de/videos/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        <div className="relative container mx-auto px-4 py-24 sm:py-32 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Find Your Perfect Connection
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Discover premium adult services in your area. Connect with verified providers
              and enjoy a safe, discreet, and professional experience.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/providers">
                <Button size="lg">Browse Providers</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">
                  Become a Provider
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Search Section */}
      <section className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-grow">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search providers or services..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-black border border-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select className="appearance-none pl-10 pr-8 py-3 rounded-lg bg-black border border-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>All Locations</option>
                  <option>Berlin</option>
                  <option>Hamburg</option>
                  <option>Munich</option>
                  <option>Cologne</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-pink-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Safe & Secure</h3>
              <p className="text-gray-400">
                All providers are verified and reviewed. Your privacy and security are our
                top priorities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-pink-500/10 rounded-lg">
                <Star className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Premium Experience
              </h3>
              <p className="text-gray-400">
                Connect with top-rated providers offering high-quality services and
                unforgettable experiences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center bg-pink-500/10 rounded-lg">
                <MapPin className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Local Connections
              </h3>
              <p className="text-gray-400">
                Find providers in your area easily with our advanced location-based
                search system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join our community of premium providers and clients. Experience the best
            adult services platform in Germany.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">Sign Up Now</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}