export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">🔒 Privacy Policy</h1>
        <p className="text-slate-400 text-lg italic leading-relaxed">Last Updated: June 2026</p>
      </div>

      <div className="prose prose-invert prose-blue max-w-none space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-400">1. Data Collection</h2>
          <p className="text-slate-300">Vectrabot Core collects and stores the following data persistently to provide its services:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li><strong>Guild & Channel IDs:</strong> Required for configuration, log routing, and automation features.</li>
            <li><strong>User IDs:</strong> To track giveaway entries, Join-to-Create room ownership, and in Audit Logs.</li>
            <li><strong>Message Content:</strong> Only processed temporarily during "Message Update" or "Message Delete" events to generate Audit Log diffs. We do not maintain a permanent database of your message history.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-400">2. Data Usage</h2>
          <p className="text-slate-300">Stored data is used exclusively for bot functionality (e.g., resuming a giveaway after a restart). We do not sell, share, or analyze your data for third-party commercial purposes.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-400">3. Data Deletion</h2>
          <p className="text-slate-300">Administrators can reset bot configurations using the <code>reset</code> subcommands. If the bot is removed from a server, its local configuration remains in the <code>data/</code> directory until manually purged by the bot host owner.</p>
        </section>
      </div>
    </div>
  );
}
