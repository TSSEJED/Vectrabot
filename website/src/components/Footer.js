import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-slate-400">&copy; 2026 Cortex HQ & bot-hosting.net. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-6">
          <Link href="/privacy" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Terms of Service</Link>
          <a href="https://bot-hosting.net" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">Enterprise Hosting</a>
        </div>
      </div>
    </footer>
  );
}
