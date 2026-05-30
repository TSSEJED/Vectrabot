export default function Features() {
  const modules = [
    {
      title: '🎁 Advanced Giveaways',
      desc: 'Full persistence, crash recovery, and reroll support. Entries are saved to disk immediately, ensuring no data loss on shutdown.'
    },
    {
      title: '🛡️ Audit Logging',
      desc: 'Track message edits (with before/after diffs), deletions, member activity, and server changes with granular category toggles.'
    },
    {
      title: '👋 Community Automation',
      desc: 'Customizable welcome and goodbye messages with smart placeholders and private DM greeting support.'
    },
    {
      title: '🔊 Voice Automation',
      desc: '"Join to Create" temporary voice rooms. Room owners get full management rights, and empty rooms are automatically purged.'
    },
    {
      title: '📊 Real-time Stats',
      desc: 'Dynamic member, bot, and role counters updated directly in channel names with periodic accuracy refreshes.'
    },
    {
      title: '⚙️ Universal Configuration',
      desc: 'True no-code setup. Manage your bot name, accent colors, emojis, and module settings entirely through slash commands.'
    }
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">🚀 Modular Features</h1>
        <p className="text-lg text-slate-400">Vectrabot Core is packed with advanced modules designed to automate and enhance your Discord community.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((mod, i) => (
          <div key={i} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold text-blue-400">{mod.title}</h3>
            <p className="text-slate-300 leading-relaxed">{mod.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
