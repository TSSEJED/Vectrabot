# 📡 Vectrabot Core

Vectrabot is a production-ready, enterprise Discord bot core template designed for **bot-hosting.net**. It features a robust architecture, high-performance command handling, and deep integration with Discord's next-generation component engine.

## 🚀 Key Features

*   **Persistent Storage**: Built-in JSON-based persistence ensures that giveaways, configurations, and state survive bot restarts.
*   **Advanced Giveaway System**: timed giveaways with persistent entries, crash recovery, and reroll capabilities.
*   **Audit Logging**: Detailed tracking of message edits/deletions, member activity, and server changes.
*   **Voice Automation**: "Join to Create" temporary voice rooms with full owner management.
*   **Community Automation**: Customizable welcome and goodbye messages with placeholders and DM support.
*   **Dynamic Emoji System**: Support for both global Unicode and custom guild-specific emojis via an admin toggle.
*   **Advanced Stats**: Real-time server metrics (member/bot/role counts) displayed in channel names.
*   **Configuration Suite**: Manage the entire bot experience (identity, logs, emojis) through intuitive slash commands.

## 🛠️ Getting Started

### Prerequisites

*   Node.js 16.11.0 or higher.
*   A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications).

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    ```
4.  Start the bot:
    ```bash
    npm start
    ```

## 📜 Documentation

For detailed guides, command lists, and feature breakdowns, visit our web-based documentation:
`/website docs`

## 🛡️ License

This project is licensed under the **AGPL-3.0-only** License. See the `LICENSE` file for details.

---
© 2026 Cortex HQ & bot-hosting.net
