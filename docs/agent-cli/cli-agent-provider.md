# CLI Agent Provider for OpenClaw

Use any CLI agent (`agent`, `claude`, or custom) as an LLM backend in OpenClaw — no API keys needed in OpenClaw, the CLI handles its own auth and tool execution.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Guide](#setup-guide)
- [Configuration Reference](#configuration-reference)
- [How It Works (Code Walkthrough)](#how-it-works-code-walkthrough)
- [Using the Agent CLI Pattern in Other Apps](#using-the-agent-cli-pattern-in-other-apps)
- [Supported CLIs](#supported-clis)
- [Comparison with Other Providers](#comparison-with-other-providers)
- [Troubleshooting](#troubleshooting)

---

## Overview

OpenClaw normally talks to LLM providers via HTTP APIs (Anthropic, OpenAI, Google, Ollama). The `cli-agent` provider type adds a new approach: **spawn an external CLI command as the LLM backend via subprocess**.

**Why?**

- **No API key management** — the CLI tool handles its own authentication (Cursor account, Anthropic login, etc.)
- **CLI tool execution** — the agent CLI can run its own tools (file edits, shell commands, web search) before returning a response
- **Zero cost in OpenClaw** — billing goes through the CLI tool's own account
- **Drop-in replacement** — works with OpenClaw's full stack (gateway, dashboard, channels, sessions)

**Precedent:** The Ollama provider (`src/agents/ollama-stream.ts`) already bypasses the default HTTP SDK with a custom `StreamFn`. The CLI agent provider follows the same pattern but replaces HTTP with subprocess spawning.

---

## Architecture

### Request Flow

```
User Message (dashboard / CLI / chat channel)
    |
    v
+----------------------------------+
|  OpenClaw Gateway (port 18789)   |
|  ws://127.0.0.1:18789           |
+---------------+------------------+
                |
                v
+----------------------------------+
|  Agent Session (attempt.ts)      |
|  - Loads system prompt           |
|  - Selects StreamFn by api type  |
|  - api="cli-agent" -> spawns CLI |
+---------------+------------------+
                |
                v
+----------------------------------+
|  cli-agent-stream.ts             |
|  createCliAgentStreamFn()        |
|                                  |
|  1. Flatten messages -> prompt   |
|  2. Detect CLI type              |
|  3. spawn("agent", ["-p",       |
|     prompt, "--output-format",   |
|     "json", "--trust","--force"])|
|  4. Collect stdout JSON          |
|  5. Parse -> AssistantMessage    |
|  6. Push to event stream         |
+---------------+------------------+
                |
                v
+----------------------------------+
|  agent CLI (Cursor Agent)        |
|  - Own auth (Cursor account)     |
|  - Own tool execution            |
|  - Returns JSON:                 |
|    { result: "...",              |
|      session_id: "...",          |
|      duration_ms: 8702 }         |
+----------------------------------+
```

### Key Difference from Normal Providers

| | Normal Provider (Anthropic, OpenAI) | CLI Agent Provider |
|---|---|---|
| **Transport** | HTTP API calls | Subprocess spawn |
| **Auth** | API key stored in OpenClaw | CLI handles own auth |
| **Tool execution** | OpenClaw runs tools in a loop | CLI runs tools internally |
| **Streaming** | Real-time token streaming | Batch (CLI runs to completion, then returns) |
| **Cost tracking** | OpenClaw tracks tokens/cost | Zero (billing through CLI account) |

---

## Setup Guide

### Prerequisites

```bash
# Node 22+ (required by OpenClaw)
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm

# At least one CLI agent installed:
agent --version   # Cursor Agent CLI
# or
claude --version  # Claude Code CLI
```

### Step 1: Clone and Build

```bash
git clone <openclaw-repo-url>
cd openclaw
pnpm install
npm run build
```

### Step 2: Create Config

```bash
mkdir -p ~/.openclaw
```

Create `~/.openclaw/openclaw.json`:

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "agent-cli": {
        "baseUrl": "agent",
        "api": "cli-agent",
        "models": [
          {
            "id": "agent-cursor",
            "name": "Cursor Agent CLI",
            "api": "cli-agent",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 200000,
            "maxTokens": 16384
          }
        ]
      },
      "claude-cli": {
        "baseUrl": "claude",
        "api": "cli-agent",
        "models": [
          {
            "id": "claude-via-cli",
            "name": "Claude Code CLI",
            "api": "cli-agent",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 200000,
            "maxTokens": 16384
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "agent-cli/agent-cursor"
      }
    }
  },
  "gateway": {
    "mode": "local"
  }
}
```

Change `"primary"` to `"claude-cli/claude-via-cli"` if you want Claude Code CLI instead.

### Step 3: Test

```bash
# Single message test (quickest verification)
nvm use 22
node openclaw.mjs agent --local --agent main -m "hello" --json
```

### Step 4: Run Full Stack

```bash
# Start gateway (runs in foreground)
nvm use 22 && node openclaw.mjs gateway run --verbose

# In another terminal, open the dashboard
nvm use 22 && node openclaw.mjs dashboard
```

The dashboard opens at `http://127.0.0.1:18789/` — send messages in the chat UI and they route through the agent CLI.

---

## Configuration Reference

### Provider Config

```json
{
  "baseUrl": "agent",
  "api": "cli-agent",
  "headers": {
    "x-cli-args": "--trust --force"
  },
  "models": [...]
}
```

| Field | Required | Description |
|---|---|---|
| `baseUrl` | Yes | CLI command to spawn: `agent`, `claude`, or full path `/usr/local/bin/agent` |
| `api` | Yes | Must be `"cli-agent"` — triggers subprocess mode |
| `headers["x-cli-args"]` | No | Extra CLI flags appended to every call (space-separated) |
| `apiKey` | No | Not needed — CLI handles auth. Ignored if present. |
| `models` | Yes | Array of model definitions |

### Model Config

```json
{
  "id": "agent-cursor",
  "name": "Cursor Agent CLI",
  "api": "cli-agent",
  "reasoning": false,
  "input": ["text"],
  "contextWindow": 200000,
  "maxTokens": 16384,
  "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
}
```

| Field | Description |
|---|---|
| `id` | Unique identifier used in model selection |
| `name` | Display name in the UI |
| `api` | Must be `"cli-agent"` |
| `contextWindow` | Used by OpenClaw for prompt truncation decisions |
| `maxTokens` | Maximum output tokens (informational — CLI controls actual limit) |
| `cost` | Set all to `0` — billing is through the CLI tool's account |

### Setting the Default Model

In `agents.defaults.model`:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "agent-cli/agent-cursor"
      }
    }
  }
}
```

Format: `<provider-name>/<model-id>`

---

## How It Works (Code Walkthrough)

### Files Modified/Created

| File | Change |
|---|---|
| `src/config/types.models.ts` | Added `"cli-agent"` to `ModelApi` union type |
| `src/config/zod-schema.core.ts` | Added `z.literal("cli-agent")` to validation schema |
| `src/agents/cli-agent-stream.ts` | **NEW** — StreamFn factory for CLI subprocess (~260 lines) |
| `src/agents/model-auth.ts` | Bypass API key check for `cli-agent` providers |
| `src/agents/pi-embedded-runner/run/attempt.ts` | Wire `cli-agent` branch + import |

### 1. Type Registration (`types.models.ts`)

```typescript
export type ModelApi =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "github-copilot"
  | "bedrock-converse-stream"
  | "ollama"
  | "cli-agent";  // <-- added
```

### 2. Auth Bypass (`model-auth.ts`)

```typescript
// cli-agent providers don't need an API key — the CLI handles its own auth.
const providerEntry = resolveProviderConfig(cfg, provider);
if (providerEntry?.api === "cli-agent") {
  return { apiKey: "unused", source: "cli-agent", mode: "api-key" };
}
```

Without this, OpenClaw would throw `"No API key found for provider"` before reaching the stream function.

### 3. Stream Function Factory (`cli-agent-stream.ts`)

The core file. `createCliAgentStreamFn(command, args)` returns a `StreamFn` compatible with OpenClaw's agent framework.

**Prompt Building:**
```typescript
// System prompt wrapped in <context> tags, messages prefixed with role
function buildCliPrompt(messages, systemPrompt) {
  // "<context>\n{systemPrompt}\n</context>\n\n[user]: hello\n\n[assistant]: hi"
}
```

**CLI Detection:**
```typescript
function detectCliType(command) {
  // "agent" -> uses --trust --force flags
  // "claude" -> uses --output-format json
  // unknown  -> generic -p only
}
```

**Subprocess Spawn:**
```typescript
const child = spawn(command, ["-p", prompt, "--output-format", "json", ...], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env },
});
child.stdin.end(); // CLI reads from args, not stdin
```

**Output Parsing:**
```typescript
// Handles both agent CLI and claude CLI JSON formats:
// agent:  { result: "...", session_id: "...", duration_ms: 8702 }
// claude: { content: [{ type: "text", text: "..." }], stop_reason: "end_turn" }
// plain:  raw text (fallback)
```

**Error & Abort Handling:**
```typescript
// Abort: kills subprocess with SIGTERM on signal
// Errors: pushed as { type: "error" } events (same pattern as ollama-stream.ts)
```

### 4. Wiring (`attempt.ts`)

```typescript
if (params.model.api === "ollama") {
  activeSession.agent.streamFn = createOllamaStreamFn(ollamaBaseUrl);
} else if (params.model.api === "cli-agent") {
  // Read command from provider config baseUrl
  const providerConfig = params.config?.models?.providers?.[params.model.provider];
  const cliCommand = providerConfig?.baseUrl ?? "claude";
  const cliArgs = providerConfig?.headers?.["x-cli-args"]?.split(" ").filter(Boolean) ?? [];
  activeSession.agent.streamFn = createCliAgentStreamFn(cliCommand, cliArgs);
} else {
  activeSession.agent.streamFn = streamSimple; // default HTTP SDK
}
```

---

## Using the Agent CLI Pattern in Other Apps

The core pattern is universal: **spawn a CLI as your LLM backend instead of calling an API**.

### Node.js / TypeScript

```typescript
import { spawn } from "node:child_process";

async function askAgent(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("agent", [
      "-p", prompt,
      "--output-format", "json",
      "--trust", "--force"
    ]);

    child.stdin.end();
    const chunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(c));

    child.on("close", (code) => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (code !== 0) return reject(new Error(`Exit ${code}`));
      const parsed = JSON.parse(raw);
      resolve(parsed.result);
    });
  });
}

// Usage
const answer = await askAgent("Explain this codebase");
console.log(answer);
```

### Python

```python
import subprocess
import json

def ask_agent(prompt: str) -> str:
    result = subprocess.run(
        ["agent", "-p", prompt, "--output-format", "json",
         "--trust", "--force"],
        capture_output=True, text=True, check=True
    )
    return json.loads(result.stdout)["result"]

# Usage
answer = ask_agent("Explain this codebase")
print(answer)
```

### Shell / Bash

```bash
#!/bin/bash
response=$(agent -p "your prompt here" --output-format json --trust --force 2>/dev/null)
echo "$response" | jq -r '.result'
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "os/exec"
)

type AgentResponse struct {
    Result    string `json:"result"`
    SessionID string `json:"session_id"`
}

func askAgent(prompt string) (string, error) {
    cmd := exec.Command("agent", "-p", prompt, "--output-format", "json", "--trust", "--force")
    out, err := cmd.Output()
    if err != nil {
        return "", err
    }
    var resp AgentResponse
    json.Unmarshal(out, &resp)
    return resp.Result, nil
}

func main() {
    answer, _ := askAgent("Explain this codebase")
    fmt.Println(answer)
}
```

### With Session Resumption (Multi-Turn)

The `agent` CLI supports sessions — pass the `session_id` from the first response to continue the conversation:

```typescript
// First call — new session
const first = await askAgent("What files are in this repo?");
// first.session_id = "ea5bf1ff-..."

// Second call — resume session
const child = spawn("agent", [
  "-p", "Now explain the main entry point",
  "--output-format", "json",
  "--trust", "--force",
  "--resume", first.session_id  // continues the conversation
]);
```

### Integration with Express / Fastify

```typescript
import express from "express";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const answer = await askAgent(message);
  res.json({ reply: answer });
});

app.listen(3000);
```

---

## Supported CLIs

### Cursor Agent CLI (`agent`)

```bash
agent -p "prompt" --output-format json --trust --force
```

| Flag | Purpose |
|---|---|
| `-p` | Print mode — run prompt and exit |
| `--output-format json` | Return structured JSON |
| `--trust` | Trust the workspace directory |
| `--force` / `-f` | Skip confirmation prompts |

**Output format:**
```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "result": "The response text...",
  "session_id": "ea5bf1ff-f400-4faf-92ff-4b8e586af953",
  "duration_ms": 8702,
  "duration_api_ms": 8702
}
```

### Claude Code CLI (`claude`)

```bash
claude -p "prompt" --output-format json
```

| Flag | Purpose |
|---|---|
| `-p` | Print mode — run prompt and exit |
| `--output-format json` | Return structured JSON |
| `--allowedTools` | Restrict which tools the CLI can use (optional) |
| `--append-system-prompt` | Add to system prompt (optional) |

**Output format:**
```json
{
  "content": [
    { "type": "text", "text": "The response text..." }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567
  }
}
```

### Custom CLI

Any CLI that accepts `-p <prompt>` and returns text or JSON to stdout will work. Set `baseUrl` to the command path.

---

## Comparison with Other Providers

| Provider | Transport | Auth in OpenClaw | Tools | Streaming | Cost Tracking |
|---|---|---|---|---|---|
| **Anthropic** | HTTP API | API key required | OpenClaw tool loop | Real-time | Yes |
| **OpenAI** | HTTP API | API key required | OpenClaw tool loop | Real-time | Yes |
| **Google** | HTTP API | API key required | OpenClaw tool loop | Real-time | Yes |
| **Ollama** | HTTP localhost | Optional | OpenClaw tool loop | Buffered NDJSON | No (local) |
| **cli-agent** | Subprocess | Not needed | CLI handles internally | Batch (wait for exit) | No (CLI account) |

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `spawn pnpm ENOENT` | pnpm not on PATH for current Node | `nvm use 22 && npm install -g pnpm` |
| `Unsupported engine node>=22.12.0` | Wrong Node version | `nvm use 22` |
| `gateway.mode=local required` | Missing gateway config | Add `"gateway": { "mode": "local" }` to `openclaw.json` |
| `No API key found for provider` | Provider not recognized as cli-agent | Ensure both provider and model have `"api": "cli-agent"` |
| `Workspace Trust Required` | agent CLI needs `--trust` | Flags are added automatically; or add `"x-cli-args": "--trust --force"` in headers |
| `CLI agent exited with code 1` | CLI command failed | Run the CLI manually: `agent -p "test" --output-format json --trust --force` |
| `CLI agent returned empty output` | CLI produced no stdout | Check stderr for errors; verify CLI is authenticated |
| `gateway already running` | Stale lock from previous run | Kill old process: `kill <pid>`, then restart |
| `command not found: agent` | CLI not installed or not on PATH | Install the CLI; or use full path in `baseUrl`: `/usr/local/bin/agent` |
| Slow responses (30-150s) | Normal — CLI does full tool execution | This is expected; the CLI thinks + uses tools before responding |

### Verify CLI Works Independently

```bash
# Test agent CLI
agent -p "say hi" --output-format json --trust --force

# Test claude CLI
claude -p "say hi" --output-format json
```

If these return JSON, the CLI is working and the OpenClaw integration will work too.

### Check Logs

```bash
# Gateway log
cat /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log | tail -50

# Config audit log
cat ~/.openclaw/logs/config-audit.jsonl
```

---

## Quick Commands Reference

```bash
# Single message test
nvm use 22 && node openclaw.mjs agent --local --agent main -m "hello" --json

# Start gateway
nvm use 22 && node openclaw.mjs gateway run --verbose

# Open dashboard
nvm use 22 && node openclaw.mjs dashboard

# Stop gateway
node openclaw.mjs gateway stop

# Health check
node openclaw.mjs doctor

# View config
node openclaw.mjs config get models
```
