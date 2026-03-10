# 🎶 Turu Turu Compiler

> Plays a cheerful **turu turu** celebration sound every time your C++ file compiles successfully!

![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 🔊 **Plays a celebratory melody** when `g++`, `clang++`, `make`, or any C++ build tool exits with code `0`
- 🎉 **Optional notification popup** — "Compilation Successful 🎉"
- 🎚️ **Configurable volume** (0.0 – 1.0)
- 🔧 **Customizable command list** — add your own build tools
- 🧪 **Test sound command** — hear it any time via the Command Palette
- ⚡ **Lightweight** — only activates when working with C++ files

---

## 📂 Project Structure

```
turu-turu-compiler/
├── .vscode/
│   ├── launch.json          # Debug: "Run Extension"
│   └── tasks.json           # Build task (tsc watch)
├── media/
│   └── turu.mp3             # The celebration sound 🎶
├── src/
│   └── extension.ts         # All extension logic
├── out/                     # Compiled JS (generated)
├── .eslintrc.json
├── .gitignore
├── .vscodeignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 How It Works

### 1. Listening for Terminal Task Completion

The extension registers two listeners:

**`vscode.tasks.onDidEndTaskProcess`** — fires when a VS Code *task* (from `tasks.json` or Run Task) finishes. We check:
- `e.exitCode === 0` → success
- The task name or its shell command contains a compile keyword (`g++`, `make`, etc.), **or** the active editor is a `.cpp` file

**`vscode.window.onDidCloseTerminal`** — fires when any terminal window closes. We check:
- `terminal.exitStatus.code === 0` → success
- Terminal name matches a compile keyword **or** active editor is a C++ file

This dual approach catches both **tasks** (declared in `tasks.json`) and **manual terminal commands** (e.g. typing `g++ main.cpp` in the integrated terminal).

### 2. How the Sound is Triggered

VS Code extensions run in Node.js — there is no native audio API. The solution:

1. A **hidden Webview panel** is created (`ViewColumn.Beside`, focus is not stolen)
2. The Webview HTML contains an `<audio>` element pointing to `media/turu.mp3` via `panel.webview.asWebviewUri()`
3. JavaScript inside the Webview calls `audio.play()` immediately on load
4. When playback ends, the Webview posts `{ command: 'soundEnded' }` back to the extension, which **closes the panel**
5. A 5-second safety timeout disposes the panel even if no message arrives

```
Extension (Node.js)
    │
    ├─ createWebviewPanel()
    │       │
    │       └─ Webview (Chromium)
    │               │
    │               ├─ <audio src="vscode-resource://.../turu.mp3">
    │               ├─ audio.play()
    │               └─ postMessage({ command: 'soundEnded' })
    │
    └─ onDidReceiveMessage → panel.dispose()
```

---

## 🛠️ Setup & Development

### Prerequisites

```bash
node -v   # >= 18
npm -v    # >= 9
```

### 1. Install Yeoman + VS Code Extension Generator (optional, for scaffolding new extensions)

```bash
npm install -g yo generator-code
```

### 2. Clone / enter the project

```bash
cd turu-turu-compiler
npm install
```

### 3. Compile TypeScript

```bash
npm run compile
# or watch mode:
npm run watch
```

### 4. Run the Extension in VS Code

Open the project folder in VS Code, then press **F5** (or go to *Run → Start Debugging*).  
A new **Extension Development Host** window will open with the extension active.

To test the sound:
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **"Turu Turu: Test Celebration Sound 🎉"**

### 5. Test with a Real C++ Compilation

In the Extension Development Host window:
1. Open any `.cpp` file
2. Open the integrated terminal (`Ctrl+\``)
3. Run: `g++ yourfile.cpp -o output`
4. If it exits with code 0 → **turu turu!** 🎶

---

## 📦 Packaging with vsce

```bash
# Install vsce if you haven't already
npm install -g @vscode/vsce

# Build the .vsix package
npm run package
# or directly:
vsce package

# Install locally for testing
code --install-extension turu-turu-compiler-1.0.0.vsix
```

---

## ⚙️ Configuration

Open **Settings** (`Ctrl+,`) and search for "Turu Turu":

| Setting | Default | Description |
|---|---|---|
| `turuTuruCompiler.showNotification` | `true` | Show popup on success |
| `turuTuruCompiler.volume` | `0.8` | Sound volume (0.0–1.0) |
| `turuTuruCompiler.detectCommands` | `["g++","gcc","clang++","clang","cmake","make","ninja"]` | Compile commands to watch |

---

## 📋 Commands

| Command | Description |
|---|---|
| `Turu Turu: Test Celebration Sound 🎉` | Play the sound immediately |
| `Turu Turu: Toggle Compilation Notifications` | Toggle the popup on/off |

---

## 📝 License

MIT © your-publisher-name
