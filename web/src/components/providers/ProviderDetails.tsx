'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  MapPin,
  Star,
  Heart,
  Calendar,
  MessageSquare,
  Share2,
  Globe,
  Languages,
  Shield,
  Coffee,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface Review {
  id: string;
  author: {
    name: string;
    avatar_url: string | null;
  };
  rating: number;
  comment: string;
  created_at: string;
}

interface ProviderDetailsProps {
  provider: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string;
    hourly_rate: number;
    city: string;
    country: string;
    languages: string[];
    rating: number;
    review_count: number;
    services: Service[];
    reviews: Review[];
    website?: string;
    is_verified: boolean;
    is_online: boolean;
  };
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export function ProviderDetails({
  provider,
  isFavorite = false,
  onFavorite,
}: ProviderDetailsProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'services' | 'reviews'>('services');

  return (
    <div className="bg-black">
      {/* Banner */}
      <div className="relative h-64 w-full">
        <Image
          src={
            provider.banner_url ||
            'https://images.unsplash.com/photo-1604014237800-1c9102c219da'
          }
          alt={provider.full_name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-24">
          <div className="flex flex-col items-center md:flex-row md:items-end md:space-x-6">
            {/* Avatar */}
            <div className="relative h-32 w-32 rounded-full border-4 border-black overflow-hidden">
              <Image
                src={
                  provider.avatar_url ||
                  `https://api.dicebear.com/6.x/avataaars/svg?seed=${provider.username}`
                }
                alt={provider.full_name}
                fill
                className="object-cover"
              />
            </div>

            {/* Basic Info */}
            <div className="mt-4 text-center md:mt-0 md:text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">
                  {provider.full_name}
                </h1>
                {provider.is_verified && (
                  <Shield className="h-6 w-6 text-blue-500" />
                )}
                <div
                  className={`h-3 w-3 rounded-full ${
                    provider.is_online ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="mt-1 flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {provider.city}, {provider.country}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {provider.rating.toFixed(1)} ({provider.review_count} reviews)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4 md:mt-0 md:ml-auto">
              {user && onFavorite && (
                <Button
                  variant="outline"
                  onClick={onFavorite}
                  className={isFavorite ? 'text-pink-500' : ''}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${
                      isFavorite ? 'fill-pink-500' : ''
                    }`}
                  />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
              )}
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Book Now
              </Button>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="ghost" className="px-2">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Bio and Additional Info */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-white">About Me</h2>
              <p className="mt-4 whitespace-pre-line text-gray-400">
                {provider.bio}
              </p>

              {/* Languages and Website */}
              <div className="mt-6 flex flex-wrap gap-6">
                {provider.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-400">
                      {provider.languages.join(', ')}
                    </span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400"
                    >
                      {provider.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="mt-8">
                <div className="border-b border-gray-800">
                  <nav className="-mb-px flex gap-8">
                    <button
                      className={`border-b-2 pb-4 text-sm font-medium ${
                        selectedTab === 'services'
                          ? 'border-pink-500 text-pink-500'
                          : 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300'
                      }`}
                      onClick={() => setSelectedTab('services')}
                    >
                      Services
                    </button>
                    <button
                      className={`border-b-2 pb-4 text-sm font-medium ${
                        selectedTab === 'reviews'
                          ? 'border-pink-500 text-pink-500'
                          : 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300'
                      }`}
                      onClick={() => setSelectedTab('reviews')}
                    >
                      Reviews ({provider.review_count})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-8">
                  {selectedTab === 'services' ? (
                    <div className="space-y-6">
                      {provider.services.map((service) => (
                        <div
                          key={service.id}
                          className="rounded-lg border border-gray-800 p-6"
                        >
                          <h3 className="text-lg font-medium text-white">
                            {service.name}
                          </h3>
                          <p className="mt-2 text-gray-400">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-lg font-semibold text-pink-500">
                              {formatPrice(service.price)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {service.duration} minutes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {provider.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border border-gray-800 p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                              <Image
                                src={
                                  review.author.avatar_url ||
                                  `https://api.dicebear.com/6.x/avataaars/svg?seed=${review.author.name}`
                                }
                                alt={review.author.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-white">
                                  {review.author.name}
                                </h4>
                                <div className="flex items-center text-yellow-500">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span className="ml-1 text-sm">
                                    {review.rating}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-2 text-gray-400">
                                {review.comment}
                              </p>
                              <p className="mt-2 text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-medium text-white">Book a Session</h3>
              <p className="mt-2 text-2xl font-bold text-pink-500">
                {formatPrice(provider.hourly_rate)}/hour
              </p>
              <Button className="mt-6 w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Check Availability
              </Button>
              <p className="mt-4 text-center text-sm text-gray-400">
                Free cancellation up to 24 hours before
              </p>

              {/* Quick Facts */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Coffee className="h-4 w-4" />
                  <span>Usually responds within 1 hour</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Star className="h-4 w-4" />
                  <span>
                    {provider.rating.toFixed(1)} ({provider.review_count} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>Identity verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}