'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  // Beispiel-Daten (später durch echte Daten ersetzen)
  const bookings = [
    {
      id: 1,
      providerName: 'Jane Doe',
      date: '2024-01-15',
      time: '14:00',
      status: 'confirmed',
    },
    {
      id: 2,
      providerName: 'John Smith',
      date: '2024-01-20',
      time: '16:30',
      status: 'pending',
    },
  ];

  const favorites = [
    {
      id: 1,
      name: 'Jane Doe',
      rating: 4.8,
      location: 'Berlin',
    },
    {
      id: 2,
      name: 'John Smith',
      rating: 4.9,
      location: 'Hamburg',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Kunden Dashboard</h1>
        <p className="text-gray-600">Willkommen zurück, {user?.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/search"
          className="bg-indigo-600 text-white p-4 rounded-lg text-center hover:bg-indigo-700 transition-colors"
        >
          Nach Anbietern suchen
        </Link>
        <Link
          href="/messages"
          className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors"
        >
          Nachrichten
        </Link>
        <Link
          href="/settings"
          className="bg-gray-600 text-white p-4 rounded-lg text-center hover:bg-gray-700 transition-colors"
        >
          Einstellungen
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`${
                activeTab === 'bookings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Meine Buchungen
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`${
                activeTab === 'favorites'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Favoriten
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Meine Buchungen</h2>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border-b pb-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{booking.providerName}</p>
                    <p className="text-sm text-gray-500">
                      {booking.date} um {booking.time}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Meine Favoriten</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-medium">{favorite.name}</h3>
                  <p className="text-sm text-gray-500">{favorite.location}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-yellow-500">
                      ★ {favorite.rating}/5.0
                    </span>
                    <Link
                      href={`/profile/${favorite.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Profil ansehen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}