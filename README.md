# 🚀 Discord Bot Template - Ready-to-Use Starter Kit! ⭐

**Modern Discord.js v14 Bot Template** with **Prefix + Slash Commands**, **Auto-Register**, **Sharding**, **Error Webhook Logging**, and **Developer-Friendly Structure**!

[![Node.js](https://img.shields.io/badge/Node.js-^18-green.svg)](https://nodejs.org) [![Discord.js](https://img.shields.io/badge/Discord.js-^14-blue.svg)](https://discord.js.org) [![MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![npm](https://img.shields.io/badge/Setup-2min-orange.svg)](https://github.com/badges/shields/)

## ✨ Features
- ✅ **Dual Commands**: Prefix (`t?`) **+** Slash (`/`)
- ⚡ **Auto Slash Register** (Global)
- 🔄 **Sharding Ready** (`shards: \"auto\"`)
- 🛡️ **Full Intents** + **Partials**
- 📊 **Error Logging** to Discord Webhook
- 📁 **Organized Structure** (commands/handlers/events)
- 🔧 **Nodemon Dev Support**
- 👑 **Owner Controls** built-in

## 🎯 Live Demo
```
[SiwuTester Bot Is Online!] ✅ Slash commands registered!
t?ping → Pong!
/ping → Pong! (Slash)
```

## 📦 2-Min Setup

### 1. Clone & Install
```bash
git clone https://github.com/calrexon/reinbot-template.git
cd reinbot-template
npm install
```

### 2. Configure `.env`
```bash
cp .env.example .env
```
**`.env`**:
```
TOKEN=your_bot_token_here
WEBHK=your_discord_error_webhook_url  # Optional
```

### 3. Run!
```bash
npm start     # 🚀 Production
npm run dev   # 🔄 Development + Auto-reload
```

**Invite Bot:** Replace `YOUR_CLIENT_ID` → [discord.com/oauth2](https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=379969&scope=bot%20applications.commands)

## 🏗️ Template Structure
```
discord-bot-template/
├── src/
│   ├── index.js           # 🎛️ Main
│   ├── config.js          # ⚙️ Settings
│   ├── handlers/          # 🛠️ Utils (errorHandler.js)
│   ├── commands/          # 🎯 Commands!
│   │   ├── prefix/main/   # t?ping.js
│   │   └── slash/mod/     # ping.js, say.js
│   └── events/            # 📡 ready.js, interactionCreate.js
├── .env.example           # 📋 Config template
├── README.md ← You are here!
└── package.json           # 📦 Deps + scripts
```

## ➕ Add Your First Command (30 Seconds!)

### Prefix Command (`t?ping`)
**File:** `src/commands/prefix/main/hello.js`
```js
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "hello",
    aliases: ["hi", "halo"],
    cooldown: 3000,
    ownerOnly: false,
    run: async (client, message, args) => {
        const embed = new EmbedBuilder()
            .setColor("#9b59ff")
            .setTitle("👋 Hello!")
            .setDescription(`Halo ${message.author}! hello **${message.guild.name}**!`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    },
};
```
**Done!** Restart bot → `t?hello`

### Slash Command (`/hello`)
**File:** `src/commands/slash/mod/hello.js`
```js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Sapa bot!"),

    cooldown: 3000,
    ownerOnly: false,

    run: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#9b59ff")
            .setTitle("👋 Hello!")
            .setDescription(`Halo ${interaction.user}! Hello di **${interaction.guild.name}**!`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
```
**Done!** Auto-registers on restart.

## 🎨 Customization Hub

### Change Prefix
`src/config.js`:
```js
prefix: '!',  // Now ?ping → !ping
```

### Add Owner Commands
```js
owner: ['123456789'],  // Your Discord ID
```

### More Intents?
`src/index.js` → Add to `intents: []`

## 🛡️ Production Features
- **Error Handler**: Logs crashes to Discord webhook
- **Rate Limit Handling**: Built-in
- **Process Monitors**: unhandledRejection, uncaughtException
- **Shard Ready**: For 1000+ guilds

## 🚀 Deploy Anywhere
```
Heroku | Railway | Render | VPS
npm start
```
**Tip:** PM2 for always-on: `pm2 start npm --name \"bot\" -- start`

## 🐛 Common Fixes
| Issue | Solution |
|-------|----------|
| ❌ No slash cmds | Re-invite w/ `applications.commands` scope |
| ❌ No prefix | Enable *Message Content Intent* |
| ❌ Token invalid | Copy from [Discord Dev Portal](https://discord.com/developers) |
| ❌ Crashes | Set WEBHK + check console |

## 🤝 Contribute & Support
1. ⭐ Star the repo
2. Fork → Add command → PR!
3. Issues? Open one.

**Questions?** Discord.js docs + learn at discordjs docs = 💪

---

**Made with ❤️ by Reincal, Readme By BLACKBOX**  
[Discord.js Guide](https://discordjs.guide/) | [Support Server](https://discord.gg/djs)  
`npm create discord-bot-template@latest` (soon™)"

