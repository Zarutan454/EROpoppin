'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { user } = useAuth();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-black px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col gap-6 py-6">
                  <Link
                    href="/providers"
                    className="text-lg font-medium text-white hover:text-pink-500"
                    onClick={onClose}
                  >
                    Providers
                  </Link>
                  <Link
                    href="/services"
                    className="text-lg font-medium text-white hover:text-pink-500"
                    onClick={onClose}
                  >
                    Services
                  </Link>
                  <Link
                    href="/locations"
                    className="text-lg font-medium text-white hover:text-pink-500"
                    onClick={onClose}
                  >
                    Locations
                  </Link>

                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        className="text-lg font-medium text-white hover:text-pink-500"
                        onClick={onClose}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/bookings"
                        className="text-lg font-medium text-white hover:text-pink-500"
                        onClick={onClose}
                      >
                        My Bookings
                      </Link>
                      <Link
                        href="/messages"
                        className="text-lg font-medium text-white hover:text-pink-500"
                        onClick={onClose}
                      >
                        Messages
                      </Link>
                      <button
                        className="text-lg font-medium text-white hover:text-pink-500 text-left"
                        onClick={() => {
                          // Handle logout
                          onClose();
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link href="/auth/login" onClick={onClose}>
                        <Button variant="ghost" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link href="/auth/register" onClick={onClose}>
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}