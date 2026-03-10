import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";

interface TuruConfig {
  showNotification: boolean;
  volume: number;
  detectCommands: string[];
}

function getConfig(): TuruConfig {
  const cfg = vscode.workspace.getConfiguration("turuTuruCompiler");
  return {
    showNotification: cfg.get<boolean>("showNotification", true),
    volume: cfg.get<number>("volume", 0.8),
    detectCommands: cfg.get<string[]>("detectCommands", [
      "g++",
      "gcc",
      "clang++",
      "clang",
      "cmake",
      "make",
      "ninja",
    ]),
  };
}

function activeCppFileOpen(): boolean {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return false;
  }
  const ext = path.extname(editor.document.fileName).toLowerCase();
  return [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx"].includes(ext);
}

function looksLikeCompileCommand(
  text: string,
  knownCommands: string[]
): boolean {
  const lower = text.toLowerCase();
  return knownCommands.some((cmd) => lower.includes(cmd.toLowerCase()));
}

function playTuruSound(context: vscode.ExtensionContext, volume: number): void {
  const songs = ["t1.mp3", "t2.mp3", "t3.mp3", "t4.mp3"];

  // Filter to only files that actually exist
  const available = songs.filter(s => {
    const full = path.join(context.extensionPath, "media", s);
    return fs.existsSync(full);
  });

  if (available.length === 0) {
    vscode.window.showWarningMessage("Turu Turu: No MP3 files found in media/");
    return;
  }

  const chosen = available[Math.floor(Math.random() * available.length)];
  const filePath = path.join(context.extensionPath, "media", chosen);

  console.log("[TuruTuru] Playing:", filePath);

  const platform = process.platform;

  let command: string;

  if (platform === "darwin") {
    // macOS — afplay is built-in, no install needed
    command = `afplay "${filePath}"`;

  } else if (platform === "win32") {
    // Windows — PowerShell Media.SoundPlayer, built-in
    command = `powershell -c (New-Object Media.SoundPlayer \\"${filePath}\\").PlaySync()`;

  } else {
    // Linux — try paplay (PulseAudio), fallback to aplay
    command = `paplay "${filePath}" 2>/dev/null || aplay "${filePath}" 2>/dev/null`;
  }

  exec(command, (error) => {
    if (error) {
      console.error("[TuruTuru] Audio playback failed:", error.message);
    }
  });
}

function celebrate(
  context: vscode.ExtensionContext,
  config: TuruConfig
): void {
  playTuruSound(context, config.volume);

  if (config.showNotification) {
    vscode.window.showInformationMessage("Compilation Successful 🎉");
  }
}

let lastTriggerTime = 0;
function tryCelebrate(context: vscode.ExtensionContext, config: TuruConfig): void {
  const now = Date.now();
  if (now - lastTriggerTime < 1000) {
    return;
  }
  lastTriggerTime = now;
  celebrate(context, config);
}

export function activate(context: vscode.ExtensionContext): void {
  console.log("Turu Turu Compiler is now active! 🎶");

  const taskListener = vscode.tasks.onDidEndTaskProcess((e) => {
    if (e.exitCode !== 0) {
      return;
    }

    const cfg = getConfig();
    const taskName = e.execution.task.name ?? "";
    const taskDef = e.execution.task.definition;
    const taskCommand: string =
      typeof taskDef?.command === "string" ? taskDef.command : "";

    const isCppTask =
      looksLikeCompileCommand(taskName, cfg.detectCommands) ||
      looksLikeCompileCommand(taskCommand, cfg.detectCommands) ||
      activeCppFileOpen();

    if (isCppTask) {
      tryCelebrate(context, cfg);
    }
  });

  const terminalListener = vscode.window.onDidCloseTerminal((terminal) => {
    const exitCode = terminal.exitStatus?.code;
    if (exitCode !== 0) {
      return;
    }

    const cfg = getConfig();
    const termName = terminal.name ?? "";

    const isCppTerminal =
      looksLikeCompileCommand(termName, cfg.detectCommands) ||
      activeCppFileOpen();

    if (isCppTerminal) {
      tryCelebrate(context, cfg);
    }
  });

  let shellExecutionListener: vscode.Disposable | undefined;
  if (vscode.window.onDidEndTerminalShellExecution) {
    shellExecutionListener = vscode.window.onDidEndTerminalShellExecution((e) => {
      if (e.exitCode !== 0) {
        return;
      }
      const cfg = getConfig();
      const cmd = e.execution.commandLine.value;
      const isCppCmd = looksLikeCompileCommand(cmd, cfg.detectCommands) || activeCppFileOpen();

      if (isCppCmd) {
        tryCelebrate(context, cfg);
      }
    });
  }

  const testSoundCmd = vscode.commands.registerCommand(
    "turuTuruCompiler.testSound",
    () => {
      const cfg = getConfig();
      tryCelebrate(context, cfg);
    }
  );

  const toggleNotifCmd = vscode.commands.registerCommand(
    "turuTuruCompiler.toggleNotification",
    async () => {
      const cfg = getConfig();
      const newValue = !cfg.showNotification;
      await vscode.workspace
        .getConfiguration("turuTuruCompiler")
        .update("showNotification", newValue, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Turu Turu notifications ${newValue ? "enabled ✅" : "disabled 🔇"}`
      );
    }
  );

  const soundFiles = ["t1.mp3", "t2.mp3", "t3.mp3", "t4.mp3"];
  const missing = soundFiles.filter(f => !fs.existsSync(path.join(context.extensionPath, "media", f)));
  if (missing.length === soundFiles.length) {
    vscode.window.showWarningMessage(
      "Turu Turu Compiler: No media files found. Please ensure the audio files are bundled with the extension."
    );
  }

  context.subscriptions.push(
    taskListener,
    terminalListener,
    testSoundCmd,
    toggleNotifCmd
  );

  if (shellExecutionListener) {
    context.subscriptions.push(shellExecutionListener);
  }
}

export function deactivate(): void {}
