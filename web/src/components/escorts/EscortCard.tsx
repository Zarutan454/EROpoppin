'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { EscortProfile } from '@/types/profile';

interface EscortCardProps {
  escort: EscortProfile;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
}

export function EscortCard({ escort, onFavorite, isFavorited = false }: EscortCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [favorite, setFavorite] = useState(isFavorited);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    onFavorite?.(escort.id);
  };

  return (
    <Link href={`/escorts/${escort.id}`}>
      <Card
        className="relative overflow-hidden transition-transform duration-300 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-64 w-full">
          <Image
            src={escort.profileImage || '/placeholder.jpg'}
            alt={escort.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <button
            onClick={handleFavoriteClick}
            className={`absolute right-2 top-2 rounded-full p-2 transition-colors ${
              favorite ? 'bg-pink-500 text-white' : 'bg-black/30 text-white hover:bg-pink-500'
            }`}
          >
            <Heart className="h-5 w-5" fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold">{escort.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span>{escort.age} Jahre</span>
            <span>•</span>
            <span>{escort.city}</span>
          </div>
          
          {isHovered && (
            <div className="mt-2 space-y-1">
              <p className="text-sm">{escort.tagline}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {escort.hourlyRate}€
                </span>
                <span className="text-sm opacity-75">pro Stunde</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}