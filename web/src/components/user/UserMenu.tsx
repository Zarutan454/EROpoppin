'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { User, Settings, LogOut, MessageSquare, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  user: any; // Replace with proper user type
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
        <span className="sr-only">Open user menu</span>
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username || 'User avatar'}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-800 rounded-md bg-black shadow-lg ring-1 ring-white ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm text-white">Signed in as</p>
            <p className="truncate text-sm font-medium text-pink-500">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/bookings"
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <Calendar className="h-5 w-5" />
                  My Bookings
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/messages"
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/favorites"
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <Heart className="h-5 w-5" />
                  Favorites
                </Link>
              )}
            </Menu.Item>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/settings"
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  className={cn(
                    active ? 'bg-gray-900 text-white' : 'text-gray-300',
                    'group flex w-full items-center px-4 py-2 text-sm gap-2'
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}