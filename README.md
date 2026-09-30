# ⚡ OmniAssist AI - Universal Chat Recall & Productivity Suite (v4.0 Supermax)

> **The ultimate browser extension & web companion for Google Gemini, ChatGPT, Claude, Perplexity, DeepSeek, Poe, and any AI platform.**  
> Supercharge your AI workflow with **universal in-page search**, **one-click prompt context injection**, **cross-platform memory recall**, **AI turn bookmarking**, **markdown/JSON exports**, and **zero-cloud local privacy**.

---

## 🌟 Supported AI Platforms & Features

### 🤖 Universal AI Platform Support
- **✨ Google Gemini** (`gemini.google.com`)
- **🟢 OpenAI ChatGPT** (`chatgpt.com` & `chat.openai.com`)
- **🟧 Anthropic Claude** (`claude.ai`)
- **🔍 Perplexity AI** (`perplexity.ai`)
- **🐋 DeepSeek** (`chat.deepseek.com`)
- **⚡ Poe by Quora** (`poe.com`)
- **🌀 Mistral Le Chat** (`chat.mistral.ai`)
- **🌐 Any Web Page or AI Platform** (`<all_urls>`)

---

## ⚡ Supermax Features (v4.0)

- **One-Click Context Injector (`⚡ Drop Context into Input`)**: Auto-detects input prompt boxes across **Gemini**, **ChatGPT**, **Claude**, **Perplexity**, **DeepSeek**, **Poe**, and drops saved memories into the AI prompt box in 1 click (Surpassing Capsule AI).
- **Two-Pass Precision Highlighter**: Non-destructively highlights search terms across active AI prompt & answer turns with step-through (`Next ▲` / `Prev ▼`) match navigation (0ms DOM thrashing).
- **60FPS Debounced DOM Observer**: Throttled mutation watching maintains smooth 60fps performance during live streaming AI output.
- **Universal Turn Capture**: Hover & bookmark conversation turns across any AI platform.
- **Right-Click Context Menus**: Highlight text anywhere to `"📌 Save to OmniAssist Memory"`, `"🔍 Search in OmniAssist"`, or `"⚡ Inject Last Memory into AI Input"`.
- **Keyboard Shortcuts**: `Ctrl+Shift+I` (inject context), `Escape` (minimize), `Ctrl+F` (search focus).

---

## 🏆 Competitor Feature Comparison Matrix

| Feature | ⚡ OmniAssist AI (v4.0) | 💊 Capsule AI | 🧠 Mem0 | 🦸 Superpower ChatGPT |
| :--- | :--- | :--- | :--- | :--- |
| **Privacy** | 🔒 100% Local-First | ☁️ Cloud Sync | ☁️ Cloud API | 🔒 Local Storage |
| **Supported Platforms** | 🌐 Gemini, GPT, Claude, Perplexity, DeepSeek, Poe & Web | 🤖 GPT, Gemini, Claude | 🤖 GPT, Gemini, Claude | ❌ ChatGPT Only |
| **In-Page Text Search** | 🔍 2-Pass Highlighting + Next/Prev | ❌ None | ❌ None | ⚠️ History Only |
| **1-Click Context Drop** | ⚡ Built-in for all AIs | ⚡ Built-in | 🤖 Auto-header | ❌ None |
| **Markdown Export** | 📝 Native Obsidian/Notion Markdown | 🔒 Proprietary | 🔒 JSON API | 📝 Text/JSON |
| **Cost** | 🆓 100% Free & Open Source | 💳 Paid Tiers | 💳 Paid API | 💳 Paid Pro |

---

## 📁 Repository Structure
## 📂 Project Structure

| File / Folder | Type | Description |
| :--- | :--- | :--- |
| **`manifest.json`** | ⚙️ Config | Manifest V3 Universal Extension configuration |
| **`background.js`** | 🧠 Script | Background service worker (Storage, context menus, context injection) |
| **`content.js`** | 🔌 Script | In-page universal widget, context injector & search highlighter |
| **`popup.html`** | 🖼️ UI | Extension popup user interface |
| **`popup.js`** | 🕹️ Script | Extension popup logic & actions |
| **`index.html`** | 📊 UI | Standalone Web Companion Dashboard |
| **`app.js`** | 🚀 Engine | Standalone web app engine |
| **`style.css`** | 🎨 Style | Master stylesheet with AI brand theme badges |
| **`icons/`** | 📁 Folder | Directory for generated high-resolution assets |
| ├── `icon16.png` | 🖼️ Asset | 16px extension icon |
| ├── `icon48.png` | 🖼️ Asset | 48px extension icon |
| └── `icon128.png` | 🖼️ Asset | 128px extension icon |
| **`README.md`** | 📝 Doc | Project documentation |


---

## 🚀 Installation & Setup

### Option 1: Load as Chrome Extension
1. Download or clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the repository folder.
5. Open [Gemini](https://gemini.google.com), [ChatGPT](https://chatgpt.com), or [Claude](https://claude.ai) — the **⚡ OmniAssist** widget will appear automatically!

### Option 2: Standalone Web Companion
1. Open `index.html` in your browser.
2. Click **Load Demo** to experience sample multi-provider AI items immediately.

---

## 🛡️ Privacy Statement
- 🔒 **100% Local & Private**: No external API calls, tracking scripts, or remote cloud servers.
- 💾 **Local Storage**: All data is stored in `chrome.storage.local` and `localStorage`.

---

## 📜 License
Licensed under the [MIT License](LICENSE).
