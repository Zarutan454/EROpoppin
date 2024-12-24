'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState } from 'react';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Beispiel-Daten (später durch echte Daten ersetzen)
  const favorites = [
    {
      id: 1,
      name: 'Jane Doe',
      location: 'Berlin',
      rating: 4.8,
      reviews: 124,
      imageUrl: 'https://example.com/image1.jpg',
      services: ['Service 1', 'Service 2'],
      hourlyRate: 150,
    },
    {
      id: 2,
      name: 'John Smith',
      location: 'Hamburg',
      rating: 4.9,
      reviews: 89,
      imageUrl: 'https://example.com/image2.jpg',
      services: ['Service 1', 'Service 3'],
      hourlyRate: 180,
    },
    // Weitere Favoriten hier hinzufügen
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meine Favoriten</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${
              view === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Du hast noch keine Favoriten
          </h2>
          <p className="text-gray-600 mb-6">
            Füge Anbieter zu deinen Favoriten hinzu, um sie hier zu sehen
          </p>
          <Link
            href="/search"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Anbieter suchen
          </Link>
        </div>
      ) : (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                view === 'list' ? 'flex' : ''
              }`}
            >
              <div
                className={`${
                  view === 'list' ? 'w-1/3' : 'w-full h-48'
                } bg-gray-200`}
              >
                {/* Placeholder für Bild */}
                <div className="w-full h-full bg-gray-300"></div>
              </div>
              <div className={`p-4 ${view === 'list' ? 'w-2/3' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{favorite.name}</h2>
                  <button className="text-red-500 hover:text-red-700">
                    <span className="sr-only">Aus Favoriten entfernen</span>
                    ❤️
                  </button>
                </div>
                <p className="text-gray-600 mb-2">{favorite.location}</p>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">
                    {favorite.rating} ({favorite.reviews} Bewertungen)
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {favorite.services.join(', ')}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">€{favorite.hourlyRate}/h</span>
                  <Link
                    href={`/profile/${favorite.id}`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                  >
                    Profil ansehen
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}