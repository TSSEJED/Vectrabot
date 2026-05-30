export default function Changelog() {
  const versions = [
    {
      version: 'v1.1.0',
      title: 'The Advanced Suite',
      changes: [
        'Implemented JSON-based persistence layer for all modules.',
        'Added advanced Giveaway recovery logic.',
        'New Audit Log module for server events.',
        'New Welcome/Goodbye system with placeholders.',
        'New Join-to-Create voice room automation.',
        'New Server Stats channel counter system.',
        'Added guild-specific Bot Identity (Name/Color) and Emoji overrides.',
        'Launched the official Next.js documentation website.'
      ]
    },
    {
      version: 'v1.0.0',
      title: 'Initial Release',
      changes: [
        'Core command handler and addon loader.',
        'Basic utility commands (avatar, stats, ping).',
        'Initial implementation of Discord Components V2.'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center">🔄 Product Changelog</h1>

      <div className="space-y-8">
        {versions.map((v, i) => (
          <div key={i} className="relative pl-12 pb-12 border-l border-slate-800 last:border-0 last:pb-0">
            <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-slate-950 shadow-glow shadow-blue-500/50" />
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white">{v.version}</span>
                <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">{v.title}</span>
              </div>
              <ul className="space-y-3">
                {v.changes.map((c, j) => (
                  <li key={j} className="text-slate-400 flex gap-3">
                    <span className="text-blue-500">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
