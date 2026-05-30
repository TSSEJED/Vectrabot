export default function Docs() {
  const sections = [
    {
      id: 'core',
      title: '1. Core Architecture',
      content: 'Vectrabot Core uses a persistence-first design. Unlike traditional bots that lose state (like giveaway entries or voice rooms) during a restart, Vectrabot utilizes a lightweight JSON storage system in utils/storage.js. This system ensures that all critical data is immediately logged to disk and recovered upon the next boot cycle.'
    },
    {
      id: 'giveaways',
      title: '2. Advanced Giveaway System',
      content: 'The giveaway module (/giveaway) is more than just a timer. It logs every participant entry in real-time. If the bot crashes, the index.js recovery loop identifies active giveaways, calculates the remaining time, and sets a new termination hook.',
      list: ['Start: Creates a new matrix entry.', 'End: Manually concludes a giveaway.', 'Reroll: Selects a new winner from the persisted participant list.']
    },
    {
      id: 'logging',
      title: '3. Audit & Event Logging',
      content: 'The logging suite is divided into system logs (Info/Error) and Server Audits. Administrators can route these to different channels using /logging set.',
      list: ['Messages: Logs edits (before/after) and deletions.', 'Members: Tracks joins/leaves with account age metadata.', 'Server: Monitors channel and role creation/deletion.']
    },
    {
      id: 'config',
      title: '4. Customization (No-Code)',
      content: 'Vectrabot is built for white-labeling. Use /bot-config to change the bot name and accent colors globally. Use /emoji to swap the default Unicode icons for your server\'s own custom emojis.'
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-12">
      <aside className="md:w-64 shrink-0 hidden md:block">
        <div className="sticky top-24 space-y-4">
          <h4 className="font-bold text-slate-200 px-4 uppercase text-xs tracking-widest">On this page</h4>
          <nav className="flex flex-col gap-1">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="px-4 py-2 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition-all text-sm">
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-grow space-y-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">📚 Technical Documentation</h1>

        {sections.map(s => (
          <section key={s.id} id={s.id} className="scroll-mt-24 space-y-6">
            <h2 className="text-3xl font-bold text-blue-400">{s.title}</h2>
            <p className="text-slate-300 leading-relaxed text-lg">{s.content}</p>
            {s.list && (
              <ul className="grid gap-3">
                {s.list.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start text-slate-400">
                    <span className="text-blue-500 mt-1.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
