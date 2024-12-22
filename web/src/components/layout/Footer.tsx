import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-gray-400">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">EROpoppin</h3>
            <p className="text-sm">
              Premium adult services platform connecting providers with clients in a safe
              and professional environment.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-pink-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-pink-500">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/providers" className="hover:text-pink-500">
                  Providers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-pink-500">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="hover:text-pink-500">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-pink-500">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-pink-500">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-pink-500">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/eropoppin"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-500"
              >
                <Twitter size={24} />
              </a>
              <a
                href="https://instagram.com/eropoppin"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-500"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://facebook.com/eropoppin"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-500"
              >
                <Facebook size={24} />
              </a>
            </div>
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-white mb-2">Newsletter</h5>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  className="bg-pink-500 text-white px-4 py-2 rounded-r hover:bg-pink-600 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} EROpoppin. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}