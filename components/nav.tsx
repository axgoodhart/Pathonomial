'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Archive, FlaskConical } from 'lucide-react';

const links = [
  { href: '/', label: 'Diagnose', icon: FlaskConical },
  { href: '/archive', label: 'Archive', icon: Archive },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-[#F9F9F8]/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 text-slate-900 font-serif font-medium text-lg">
          <BookOpen className="w-5 h-5" />
          Pathonomial
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pathname === href
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
