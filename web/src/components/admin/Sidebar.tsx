import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Sidebar: React.FC = () => {
  const router = useRouter();

  return (
    <div className="w-64 h-screen bg-white border-r">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2 p-4">
            <li>
              <Link href="/admin/dashboard"
                    className={`block p-2 rounded ${
                      router.pathname === '/admin/dashboard' ? 'bg-gray-100' : ''
                    }`}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users"
                    className={`block p-2 rounded ${
                      router.pathname === '/admin/users' ? 'bg-gray-100' : ''
                    }`}>
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/settings"
                    className={`block p-2 rounded ${
                      router.pathname === '/admin/settings' ? 'bg-gray-100' : ''
                    }`}>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;