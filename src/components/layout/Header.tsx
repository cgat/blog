'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  blogName?: string;
}

export function Header({ blogName = 'My Blog' }: HeaderProps) {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold text-deep-space hover:text-blue-green transition-colors">
          {blogName}
        </a>

        {status === 'loading' ? (
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        ) : session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar
                src={session.user?.image}
                fallback={session.user?.name || ''}
                size="sm"
              />
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]">
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => signIn('google')}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
