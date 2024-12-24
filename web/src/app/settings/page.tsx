'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { languages } from '@/app/i18n/settings';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedLanguage, setSelectedLanguage] = useState('de');

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // TODO: Implement language change logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Einstellungen</h1>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-900 hover:bg-gray-50'
              } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-900 hover:bg-gray-50'
              } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
            >
              Sicherheit
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-900 hover:bg-gray-50'
              } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
            >
              Benachrichtigungen
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`${
                activeTab === 'language'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-900 hover:bg-gray-50'
              } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
            >
              Sprache
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`${
                activeTab === 'privacy'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-900 hover:bg-gray-50'
              } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full`}
            >
              Privatsphäre
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <div className="bg-white shadow rounded-lg">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profil-Einstellungen</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={user?.email || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={user?.full_name || ''}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sicherheit</h2>
                <div className="space-y-4">
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Passwort ändern
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-800">
                    Zwei-Faktor-Authentifizierung einrichten
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Benachrichtigungseinstellungen
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>E-Mail-Benachrichtigungen</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push-Benachrichtigungen</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Spracheinstellungen</h2>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Sprache auswählen
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Privatsphäre</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Profil öffentlich sichtbar</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Online-Status anzeigen</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}