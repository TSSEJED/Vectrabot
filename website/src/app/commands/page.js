export default function Commands() {
  const commands = [
    { cmd: '/help', desc: 'View the interactive directory of all active commands.', perm: 'Everyone' },
    { cmd: '/bot-config', desc: 'Manage bot identity (name, color) for the server.', perm: 'Administrator' },
    { cmd: '/emoji', desc: 'Configure custom and global emojis for the server.', perm: 'Administrator' },
    { cmd: '/logging', desc: 'View and configure system logging channels and audit categories.', perm: 'Administrator' },
    { cmd: '/welcome', desc: 'Configure customizable join and leave messages.', perm: 'Administrator' },
    { cmd: '/jtc', desc: 'Setup "Join to Create" voice room automation.', perm: 'Administrator' },
    { cmd: '/server-stats', desc: 'Configure real-time server statistics channels.', perm: 'Administrator' },
    { cmd: '/giveaway', desc: 'Launch and manage persistent server giveaways.', perm: 'Manage Events' },
    { cmd: '/stats', desc: 'Display system hardware and cache metrics.', perm: 'Everyone' },
    { cmd: '/ping', desc: 'Calculate gateway and connection latency.', perm: 'Everyone' },
    { cmd: '/avatar', desc: "Fetch and render a user's global or guild avatar.", perm: 'Everyone' },
    { cmd: '/banner', desc: "Fetch a user's or server's custom banner image.", perm: 'Everyone' },
    { cmd: '/serverinfo', desc: 'Fetch comprehensive server metadata and stats.', perm: 'Everyone' },
    { cmd: '/userinfo', desc: 'Fetch comprehensive user profile data.', perm: 'Everyone' },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">📜 Full Command Matrix</h1>
        <p className="text-lg text-slate-400">Every command is built with Discord's latest Component Engine and strict permission enforcement.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="p-6 font-bold text-slate-200">Command</th>
              <th className="p-6 font-bold text-slate-200">Description</th>
              <th className="p-6 font-bold text-slate-200">Permission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {commands.map((c, i) => (
              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-6 font-mono text-blue-400 font-bold">{c.cmd}</td>
                <td className="p-6 text-slate-300">{c.desc}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.perm === 'Everyone' ? 'bg-slate-800 text-slate-400' : 'bg-blue-900/30 text-blue-300'}`}>
                    {c.perm}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
