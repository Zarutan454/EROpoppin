'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { MapPin, Star, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Provider {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  hourly_rate: number;
  city: string;
  rating: number;
  review_count: number;
  services: string[];
  is_verified: boolean;
  is_online: boolean;
}

interface ProviderListProps {
  providers: Provider[];
  onFavorite?: (providerId: string) => void;
  favorites?: Set<string>;
}

export function ProviderList({
  providers,
  onFavorite,
  favorites = new Set(),
}: ProviderListProps) {
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {providers.map((provider) => (
        <Card
          key={provider.id}
          className="group relative overflow-hidden transition-all hover:shadow-lg"
          onMouseEnter={() => setHoveredCard(provider.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Link href={`/providers/${provider.username}`}>
            <div className="relative aspect-[3/4]">
              <Image
                src={
                  provider.avatar_url ||
                  `https://api.dicebear.com/6.x/avataaars/svg?seed=${provider.username}`
                }
                alt={provider.full_name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Online Status */}
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      provider.is_online ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-xs text-white">
                    {provider.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Favorite Button */}
              {user && onFavorite && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onFavorite(provider.id);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-2 transition-colors hover:bg-black"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.has(provider.id)
                        ? 'fill-pink-500 text-pink-500'
                        : 'text-white'
                    }`}
                  />
                </button>
              )}

              {/* Location */}
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                  <MapPin className="h-3 w-3 text-white" />
                  <span className="text-xs text-white">{provider.city}</span>
                </div>
              </div>

              {/* Rating */}
              {provider.review_count > 0 && (
                <div className="absolute bottom-2 right-2">
                  <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-white">
                      {provider.rating.toFixed(1)} ({provider.review_count})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{provider.full_name}</h3>
                <p className="text-pink-500">
                  {formatPrice(provider.hourly_rate)}/h
                </p>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-400">
                  {provider.services.slice(0, 3).join(', ')}
                  {provider.services.length > 3 && ' ...'}
                </p>
              </div>

              {provider.is_verified && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                </div>
              )}
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
}