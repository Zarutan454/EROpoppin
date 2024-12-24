'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EscortProfile } from '@/types/profile';
import { Calendar, MapPin, Clock, Star, Heart } from 'lucide-react';

export default function EscortDetailPage() {
  const params = useParams();
  const [escort, setEscort] = useState<EscortProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscortData = async () => {
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/escorts/${params.id}`);
        const data = await response.json();
        setEscort(data);
      } catch (error) {
        console.error('Failed to fetch escort data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEscortData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!escort) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Profil nicht gefunden</h1>
          <p className="text-gray-600">
            Das gewünschte Profil existiert nicht oder wurde gelöscht.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="md:col-span-2">
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src={escort.profileImage || '/placeholder.jpg'}
              alt={escort.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{escort.name}</h1>
            <p className="text-xl text-gray-600">{escort.tagline}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>{escort.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>4.8 (24 Bewertungen)</span>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Buchung</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>1 Stunde</span>
                <span className="font-semibold">{escort.hourlyRate}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span>2 Stunden</span>
                <span className="font-semibold">{escort.hourlyRate * 2}€</span>
              </div>
              <Button className="w-full">
                Jetzt buchen
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Alter</span>
                <p className="font-semibold">{escort.age} Jahre</p>
              </div>
              <div>
                <span className="text-gray-600">Größe</span>
                <p className="font-semibold">{escort.height} cm</p>
              </div>
              <div>
                <span className="text-gray-600">Nationalität</span>
                <p className="font-semibold">{escort.nationality}</p>
              </div>
              <div>
                <span className="text-gray-600">Sprachen</span>
                <p className="font-semibold">{escort.languages?.join(', ')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Über mich</h2>
        <div className="prose max-w-none">
          {escort.description}
        </div>
      </div>
    </div>
  );
}