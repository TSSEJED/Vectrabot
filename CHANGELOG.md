# CHANGELOG

All notable changes to the **Vectrabot** partnership service template will be documented in this file.

## [1.0.0] - 2026-05-28

### Added
- **Dynamic Bot Display Name**: Integrated `BOT_NAME` environment variable (`.env` and `.env.example`) to dynamically resolve user-facing bot names rather than hardcoding.
- **Dynamic Logging Matrix**: Enabled channel-level log routing via `INFO_LOG_CHANNEL_ID`, `WARN_LOG_CHANNEL_ID`, `ERROR_LOG_CHANNEL_ID`, and a dedicated `COMMAND_LOG_CHANNEL_ID`.
- **System Administration Command**: Added `/logging` slash command utilizing Discord Components V2 Containers to display channel matrix status.
- **Dynamic Command Bootloader**: Initialized Node.js bot bootloader client featuring dynamic scanners for `core_commands/` and `addons/` folders.
- **Centralized Event Logger**: Implemented a channel-broadcasting `Logger` instance integrated on the `client` object, leveraging Discord Components V2 Containers for event log routing.
- **Discord Components V2 Integration**: Configured bitwise IS_COMPONENTS_V2 flags (`1 << 15`) and container/section structures for `/help` and `/support` commands.
- **Immutable Emoji Directory**: Created `config/emojis.js` exporting frozen Unicode symbols and custom Guild placeholder identifiers, now featuring a client-side emoji cache check resolver for dynamic Unicode fallbacks.
- **Vercel-Optimized Web Suite**: Built a premium Next.js App Router website inside the `/website` directory, including custom HSL dark theme variables, responsive grids, and Google Font (Outfit) integrations.
- **Legal Compliance Pages**: Added complete Terms of Service and Privacy Policy screens tailored to self-hosted instances on bot-hosting.net.
- **Comprehensive Documentation**: Added a root `README.md` containing architectural flow diagrams, setup instructions, and created a `.env.example` blueprint configuration file.


