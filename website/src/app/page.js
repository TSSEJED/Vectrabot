import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="py-20 text-center space-y-8 animate-in fade-in duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 pb-2">
          Powering the Future of Community Management
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Vectrabot Core is a production-ready, enterprise-grade Discord bot template designed for performance, reliability, and complete customization.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/docs" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20">
            Read Documentation
          </Link>
          <Link href="/features" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700">
            Explore Modules
          </Link>
        </div>
      </section>

      {/* Highlights */}
      <section className="grid md:grid-cols-3 gap-8 py-20 w-full">
        {[
          { icon: '🚀', title: 'Enterprise Core', desc: 'Built on discord.js v14 with a modular, scalable architecture ready for massive scale.' },
          { icon: '💾', title: 'Persistent State', desc: 'Built-in JSON storage ensures giveaways and configurations survive reboots.' },
          { icon: '🛡️', title: 'Secure by Design', desc: 'Strict permission audits and administrative command locks keep your server safe.' }
        ].map((item, i) => (
          <div key={i} className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-colors group">
            <div className="text-4xl mb-6 bg-slate-800 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-blue-600 transition-colors">
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
