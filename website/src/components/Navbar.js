import Link from 'next/link';

export default function Navbar() {
  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Commands', href: '/commands' },
    { name: 'Docs', href: '/docs' },
    { name: 'Changelog', href: '/changelog' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-blue-500 font-bold text-xl flex items-center gap-2">
              <span className="text-2xl">📡</span> Vectrabot
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
