# Agent-Driver Integration Guide

How CodeAdvocate CLI uses `claude -p` / `agent -p` as an execution engine, and how to replicate this pattern in your own CLI or app.

---

## Table of Contents

1. [How It Works (Big Picture)](#how-it-works-big-picture)
2. [The Two Spawn Modes](#the-two-spawn-modes)
3. [Non-Interactive Mode (Primary)](#non-interactive-mode-primary)
4. [Interactive PTY Mode](#interactive-pty-mode)
5. [CLI Detection & Flag Building](#cli-detection--flag-building)
6. [Output Parsing (JSON + Markers)](#output-parsing-json--markers)
7. [Session Continuity (--resume)](#session-continuity---resume)
8. [MCP Tool Injection](#mcp-tool-injection)
9. [Git Identity Override](#git-identity-override)
10. [Prompt Building Strategy](#prompt-building-strategy)
11. [Supervisor LLM (Interactive Mode)](#supervisor-llm-interactive-mode)
12. [Error Handling & Circuit Breaker](#error-handling--circuit-breaker)
13. [Swarm Mode (Boss + Workers)](#swarm-mode-boss--workers)
14. [Sub-Agent Delegation](#sub-agent-delegation)
15. [Config Merging (3-Level)](#config-merging-3-level)
16. [Step-by-Step: Build Your Own Integration](#step-by-step-build-your-own-integration)
17. [Complete Working Example (Node.js)](#complete-working-example-nodejs)
18. [Complete Working Example (Python)](#complete-working-example-python)

---

## How It Works (Big Picture)

CodeAdvocate CLI doesn't call the Claude API directly when in agent-driver mode. Instead, it spawns `claude` or `agent` as a **child process**, passes a prompt via `-p`, and reads structured JSON output.

```
┌─────────────────────┐
│  Your App / CLI      │
│                     │
│  1. Build prompt    │
│  2. Spawn process   │──► claude -p "prompt" --output-format json
│  3. Close stdin     │
│  4. Collect stdout  │◄── { "result": "...", "session_id": "abc" }
│  5. Parse JSON      │
│  6. Extract markers │
│  7. Use --resume    │──► claude -p "next task" --resume abc
└─────────────────────┘
```

**Why this pattern?**
- No API key management — the external CLI handles its own auth
- Tool ecosystem included (file read/write, bash, grep, etc.)
- Session continuity via `--resume`
- Works with Claude Code, Cursor Agent, or any compatible CLI

---

## The Two Spawn Modes

| Mode | When Used | How | Stdin |
|------|-----------|-----|-------|
| **Non-interactive** | Default, autonomous tasks | `spawn()` with pipes, stdin closed immediately | Closed |
| **Interactive (PTY)** | When CLI needs user input (permissions, questions) | `node-pty` pseudo-terminal | Open, controlled by supervisor |

**Auto-detection logic** (from `config.ts`):

```
mode: "auto" (default)
  → If task is simple OR no supervisor API key → non-interactive
  → If task needs approvals → interactive (PTY)

mode: "non-interactive"
  → Always spawn with stdin closed

mode: "interactive"
  → Always use PTY + supervisor
```

---

## Non-Interactive Mode (Primary)

This is the main pattern. Your app spawns the CLI, closes stdin, collects JSON output.

### Spawn

```typescript
import { spawn } from 'child_process';

const proc = spawn('claude', args, {
  cwd: '/path/to/repo',
  env: { ...process.env, ...extraEnvVars },
  stdio: ['pipe', 'pipe', 'pipe'],  // pipe all three
});

// Close stdin immediately — CLI runs autonomously
proc.stdin.end();
```

### Collect Output

```typescript
const stdoutChunks: string[] = [];
const stderrChunks: string[] = [];

proc.stdout.on('data', (chunk) => stdoutChunks.push(chunk.toString()));
proc.stderr.on('data', (chunk) => stderrChunks.push(chunk.toString()));

const exitCode = await new Promise<number>((resolve) => {
  proc.on('close', (code) => resolve(code ?? 1));
});
```

### Timeout + Kill

```typescript
const TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes

const timeout = setTimeout(() => {
  proc.kill('SIGTERM');
  // Force kill if SIGTERM doesn't work after 5s
  setTimeout(() => proc.kill('SIGKILL'), 5000);
}, TIMEOUT_MS);

proc.on('close', () => clearTimeout(timeout));
```

---

## CLI Detection & Flag Building

Different CLIs need different flags. CodeAdvocate detects the CLI type from the command name:

### Detection

```typescript
function detectCLIType(command: string): 'claude' | 'agent' | 'unknown' {
  const basename = command.split('/').pop()?.toLowerCase() ?? '';
  if (basename === 'claude' || basename === 'claude-code') return 'claude';
  if (basename === 'agent' || basename === 'cursor') return 'agent';
  return 'unknown';
}
```

### Claude Code Flags

```bash
claude -p "<prompt>" \
  --output-format json \
  --allowedTools "Write,Read,Edit,Bash(git *)" \
  --append-system-prompt "<system context>" \
  --resume <session-id>          # optional, for multi-turn
```

| Flag | Purpose |
|------|---------|
| `-p <prompt>` | The task prompt (can be a file path or inline text) |
| `--output-format json` | Return structured JSON instead of plain text |
| `--allowedTools tool1,tool2` | Restrict which tools the agent can use |
| `--append-system-prompt <text>` | Inject extra system context (company info, knowledge) |
| `--resume <session-id>` | Continue a previous session (multi-turn conversation) |

### Cursor Agent / Generic Agent Flags

```bash
agent -p "<prompt>" \
  --output-format json \
  --trust \
  --force \
  --resume <session-id>
```

| Flag | Purpose |
|------|---------|
| `-p <prompt>` | The task prompt |
| `--output-format json` | Structured JSON output |
| `--trust` | Trust all tool operations (no confirmation) |
| `--force` | Force operation without interactive prompts |
| `--resume <session-id>` | Continue previous session |

**Key difference**: Cursor Agent does NOT support `--allowedTools` or `--append-system-prompt`. System context must be prepended to the prompt:

```typescript
if (cliType === 'agent') {
  // Prepend system context directly into the prompt
  const fullPrompt = systemContext
    ? `<context>\n${systemContext}\n</context>\n\n${taskPrompt}`
    : taskPrompt;
  args.push('-p', fullPrompt);
  args.push('--output-format', 'json');
  args.push('--trust');
  args.push('--force');
} else {
  // Claude Code: use dedicated flags
  args.push('-p', taskPrompt);
  args.push('--output-format', 'json');
  args.push('--allowedTools', allowedTools.join(','));
  args.push('--append-system-prompt', systemContext);
}
```

### Full Argument Builder (from CodeAdvocate)

```typescript
function buildArgs(
  cliType: 'claude' | 'agent',
  prompt: string,
  opts: {
    outputFormat?: string;
    tools?: string[];
    sessionId?: string;
    systemContext?: string;
  }
): string[] {
  const args: string[] = [];

  if (cliType === 'claude') {
    args.push('-p', prompt);
    args.push('--output-format', opts.outputFormat || 'json');
    if (opts.tools?.length) {
      args.push('--allowedTools', opts.tools.join(','));
    }
    if (opts.sessionId) {
      args.push('--resume', opts.sessionId);
    }
    if (opts.systemContext) {
      args.push('--append-system-prompt', opts.systemContext);
    }
  } else {
    // Cursor Agent / generic — prepend context into prompt
    const fullPrompt = opts.systemContext
      ? `<context>\n${opts.systemContext}\n</context>\n\n${prompt}`
      : prompt;
    args.push('-p', fullPrompt);
    args.push('--output-format', opts.outputFormat || 'json');
    args.push('--trust');
    args.push('--force');
    if (opts.sessionId) {
      args.push('--resume', opts.sessionId);
    }
  }

  return args;
}
```

---

## Output Parsing (JSON + Markers)

### JSON Output Shape

When using `--output-format json`, the CLI returns:

```json
{
  "result": "The actual output text from the agent...",
  "is_error": false,
  "session_id": "abc123-def456",
  "num_turns": 12,
  "usage": {
    "input_tokens": 15000,
    "output_tokens": 3000
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `result` | string | The agent's text output |
| `is_error` | boolean | Whether the agent encountered an error |
| `session_id` | string | Session ID for `--resume` in next call |
| `num_turns` | number | How many tool-use rounds the agent did |
| `usage.input_tokens` | number | Total input tokens consumed |
| `usage.output_tokens` | number | Total output tokens generated |

**Cursor Agent** returns a slightly different format:

```json
{
  "type": "result",
  "subtype": "error",         // only if error
  "result": "...",
  "duration_ms": 45000,
  "request_id": "req_abc123"
}
```

### Normalize Across CLIs

```typescript
interface ParsedOutput {
  result: string;
  isError: boolean;
  sessionId?: string;
  turns: number;
  inputTokens: number;
  outputTokens: number;
}

function parseOutput(rawStdout: string, exitCode: number): ParsedOutput {
  let parsed: any;
  try {
    parsed = JSON.parse(rawStdout);
  } catch {
    // Not valid JSON — treat as plain text
    return {
      result: rawStdout,
      isError: exitCode !== 0,
      turns: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  // Normalize Cursor Agent format
  if (parsed.type === 'result') {
    if (parsed.is_error === undefined && parsed.subtype === 'error') {
      parsed.is_error = true;
    }
    if (parsed.num_turns === undefined && parsed.duration_ms) {
      parsed.num_turns = Math.max(1, Math.round(parsed.duration_ms / 10000));
    }
  }

  return {
    result: parsed.result ?? rawStdout,
    isError: parsed.is_error ?? (exitCode !== 0),
    sessionId: parsed.session_id,
    turns: parsed.num_turns ?? 0,
    inputTokens: parsed.usage?.input_tokens ?? 0,
    outputTokens: parsed.usage?.output_tokens ?? 0,
  };
}
```

### Structured Output Markers

CodeAdvocate requires agents to output structured markers in their text result:

```
STATUS: done
CHANGES: src/auth.ts, src/middleware.ts
PR_URL: https://github.com/user/repo/pull/42
NOTES: Added JWT-based auth with refresh tokens
```

**Extract markers:**

```typescript
function extractMarkers(text: string): Record<string, string> {
  const markers: Record<string, string> = {};
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^([A-Z_]+):\s*(.+)$/);
    if (match) {
      markers[match[1]] = match[2].trim();
    }
  }

  return markers;
}

// Usage:
const markers = extractMarkers(parsed.result);
// markers.STATUS === 'done'
// markers.CHANGES === 'src/auth.ts, src/middleware.ts'
// markers.PR_URL === 'https://github.com/user/repo/pull/42'
```

**Special marker: STORIES_JSON** (multi-line JSON):

```typescript
function extractJsonMarker(text: string, key: string): any | null {
  const regex = new RegExp(`${key}:\\s*(\\[\\s*\\{[\\s\\S]*?\\])`);
  const match = text.match(regex);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
```

### STATUS Conversion (failed → retry)

CodeAdvocate converts `STATUS: failed` to `STATUS: retry` because:
- Agents output "failed" for recoverable errors (network, auth, missing file)
- The pipeline engine only retries on "retry" status
- This ensures automatic recovery without manual intervention

```typescript
if (/^STATUS:\s*failed/m.test(resultText)) {
  resultText = resultText.replace(/^(STATUS:\s*)failed/m, '$1retry');
}
```

---

## Session Continuity (--resume)

The `--resume` flag lets you have multi-turn conversations with the same agent session.

### Flow

```
Call 1: claude -p "Plan the feature"  → session_id: "abc123"
Call 2: claude -p "Now implement story 1" --resume abc123  → session_id: "abc123"
Call 3: claude -p "Run the tests" --resume abc123  → session_id: "abc123"
```

### Implementation

```typescript
let sessionId: string | undefined;

async function runStep(prompt: string): Promise<string> {
  const args = buildArgs('claude', prompt, {
    outputFormat: 'json',
    sessionId,  // undefined on first call, then reused
  });

  const output = await spawnAndCollect('claude', args, repoPath);
  const parsed = parseOutput(output.stdout, output.exitCode);

  // Save session_id for next call
  if (parsed.sessionId) {
    sessionId = parsed.sessionId;
  }

  return parsed.result;
}

// Multi-step workflow:
await runStep('Plan the feature: Add user notifications');
await runStep('Now implement story S-1: Create database migration');
await runStep('Run tests and verify');
```

### Boss Loop Pattern (Swarm)

In swarm mode, the boss agent maintains one persistent session across all review rounds:

```typescript
class BossLoop {
  private sessionId?: string;

  async runRound(prompt: string): Promise<string> {
    const args = buildArgs('claude', prompt, {
      outputFormat: 'json',
      sessionId: this.sessionId,  // Persist across ALL rounds
    });

    const result = await spawnAndCollect('claude', args);
    const parsed = parseOutput(result.stdout, result.exitCode);

    if (parsed.sessionId) {
      this.sessionId = parsed.sessionId;  // Carry forward
    }

    return parsed.result;
  }
}
```

---

## MCP Tool Injection

CodeAdvocate injects MCP (Model Context Protocol) tools into the agent CLI by writing a temporary `.mcp.json` file in the repo root.

### How It Works

```typescript
function setupMCPConfig(repoPath: string, apiKey: string): () => void {
  const mcpPath = join(repoPath, '.mcp.json');

  // Save existing .mcp.json if present
  let backup: string | null = null;
  if (existsSync(mcpPath)) {
    backup = readFileSync(mcpPath, 'utf-8');
  }

  // Write temporary .mcp.json with CodeAdvocate MCP server
  const config = {
    mcpServers: {
      codeadvocate: {
        url: 'http://your-mcp-server:3232/mcp',
        transport: 'streamable-http',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    },
  };

  writeFileSync(mcpPath, JSON.stringify(config, null, 2));

  // Return cleanup function
  return () => {
    if (backup) {
      writeFileSync(mcpPath, backup);
    } else {
      unlinkSync(mcpPath);
    }
  };
}

// Usage:
const cleanup = setupMCPConfig(repoPath, apiKey);
try {
  await runAgent(prompt, repoPath);
} finally {
  cleanup();  // Restore original .mcp.json
}
```

### Pass Tool Names to Claude

```typescript
// MCP tools appear as: mcp__servername__toolname
const allowedTools = [
  'Write', 'Read', 'Edit', 'Bash(git *)',           // built-in tools
  'mcp__codeadvocate__search_code',                   // MCP tools
  'mcp__codeadvocate__save_knowledge',
];

args.push('--allowedTools', allowedTools.join(','));
```

---

## Git Identity Override

Prevent the agent CLI from adding its own name to commits:

```typescript
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Your App Name',
  GIT_COMMITTER_NAME: 'Your App Name',
  GIT_AUTHOR_EMAIL: 'app@example.com',
  GIT_COMMITTER_EMAIL: 'app@example.com',
};

const proc = spawn('claude', args, { cwd: repoPath, env });
```

This forces all git commits made by the agent to use your app's identity instead of "Claude" or "Cursor".

---

## Prompt Building Strategy

CodeAdvocate uses a two-part prompt strategy:

### Part 1: Task Prompt (-p flag)

The actual task. Includes:
- Agent identity and role
- Objective / task description
- Repository path
- Context from previous steps (branch name, build command, etc.)
- Required output format (STATUS, CHANGES, etc.)

```markdown
# Task

You are the developer agent (worker role) for the feature-dev workflow.

## Objective

Implement user authentication with JWT tokens.

## Repository

Path: /Users/dev/my-project
Branch: feature/add-auth
Build: npm run build
Test: npm test

## Previous Step Output

PLAN_SUMMARY: Add JWT auth middleware, create login/register endpoints, add protected routes.

## Required Output

When done, output these markers on separate lines (NOT in code blocks):

STATUS: done | retry
CHANGES: list of files changed
COMMIT: the commit hash
NOTES: any observations (optional)
```

### Part 2: System Context (--append-system-prompt)

Who the agent is and what it knows. Injected as system context:

```markdown
# Company & Team Context

## Company
Name: Acme Corp
Mission: Build the best developer tools

## Team
Name: Backend Team
Lead: tech-lead-agent

## Knowledge & History
- Previous runs discovered: SQLite is used for persistence
- Pattern: All API routes follow REST conventions in src/api/
- Known issue: Build sometimes fails on first try (cached types)
```

### For Cursor Agent (no --append-system-prompt)

Prepend context directly into the prompt:

```typescript
const prompt = `<context>
# Company & Team Context
Name: Acme Corp
Team: Backend Team
Knowledge: SQLite persistence, REST API pattern
</context>

# Task
Implement user authentication with JWT tokens.
...`;
```

### Temporary Prompt Files

For long prompts, write to a temp file and pass the path:

```typescript
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'os';
import { tmpdir } from 'os';

function writePromptFile(prompt: string, runId: string): string {
  const filename = `prompt-${runId.slice(0, 8)}-${Date.now()}.md`;
  const filepath = join(tmpdir(), filename);
  writeFileSync(filepath, prompt, 'utf-8');
  return filepath;
}

// Use it:
const promptFile = writePromptFile(longPrompt, runId);
const args = ['-p', promptFile, '--output-format', 'json'];
// ... spawn and collect ...
unlinkSync(promptFile);  // cleanup
```

---

## Interactive PTY Mode

For tasks that need real-time interaction (permissions, questions, menus).

### Setup (requires node-pty)

```bash
npm install node-pty
```

### Spawn PTY

```typescript
import * as pty from 'node-pty';

const ptyProcess = pty.spawn('claude', ['-p', prompt], {
  name: 'xterm-256color',
  cols: 200,
  rows: 50,
  cwd: repoPath,
  env: { ...process.env, ...extraEnv },
});
```

### Read Output & Detect State

```typescript
let outputBuffer = '';

ptyProcess.onData((data: string) => {
  // Strip ANSI escape codes
  const clean = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  outputBuffer += clean;

  // Detect what the CLI is waiting for
  const state = detectState(outputBuffer);

  if (state === 'permission_prompt') {
    ptyProcess.write('y');          // Approve
  } else if (state === 'question') {
    ptyProcess.write('Continue\r'); // Answer + Enter
  } else if (state === 'done') {
    ptyProcess.kill();
  }
});
```

### State Detection

```typescript
function detectState(output: string): string {
  const lastLines = output.split('\n').slice(-20);
  const lastChunk = lastLines.join('\n');

  // Permission prompt: "Allow X? (y/n)"
  if (/\(y\/n\)/i.test(lastChunk)) return 'permission_prompt';
  if (/Allow.*\?/i.test(lastChunk)) return 'permission_prompt';
  if (/Waiting for approval/i.test(lastChunk)) return 'permission_prompt';

  // Question: line ending with "?"
  if (/\?\s*$/.test(lastChunk)) return 'question';

  // Error
  if (/Error:|FATAL|panic/i.test(lastChunk)) return 'error';

  // Done indicators
  if (/STATUS:\s*done/m.test(lastChunk)) return 'done';

  // Interactive menu
  if (/\[.*\].*select|choose|pick/i.test(lastChunk)) return 'interactive_menu';

  // Working (box-drawing characters = TUI rendering)
  if (/[│┌┐└┘├┤┬┴┼]/g.test(lastChunk)) return 'working';

  return 'waiting';
}
```

### Write to PTY

```typescript
// Send text + Enter
ptyProcess.write('yes\r');

// Send single keypress (y/n)
ptyProcess.write('y');

// Send Enter key
ptyProcess.write('\r');
```

---

## Supervisor LLM (Interactive Mode)

In interactive mode, a separate "supervisor" LLM watches the CLI output and decides how to respond.

### Decision Model

```
CLI Output → Parse State → Supervisor LLM → Action
                                              ├── approve (send 'y' or Enter)
                                              ├── reject (send 'n')
                                              ├── respond (send text + Enter)
                                              └── abort (kill process)
```

### Auto-Approve (No LLM Call Needed)

Safe operations can be auto-approved without an LLM call:

```typescript
const SAFE_PATTERNS = [
  'read_file', 'search_files', 'list_files',
  'git status', 'git diff', 'git log',
  'ls', 'cat', 'head', 'tail', 'find', 'grep',
  'npm test', 'npm run test', 'npx jest', 'npx vitest',
];

function isAutoApprovable(commandText: string): boolean {
  return SAFE_PATTERNS.some(pattern =>
    commandText.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### LLM Supervisor Call

For non-trivial decisions, call a cheap/fast model:

```typescript
async function supervisorDecide(cliOutput: string, taskContext: string): Promise<{
  action: 'approve' | 'reject' | 'respond' | 'abort';
  response: string;
}> {
  const systemPrompt = `You are a supervisor monitoring a CLI agent.
The agent is working on: ${taskContext}

The agent's current output is shown below. Decide what to do:
- If it's asking permission for a safe operation: approve
- If it's asking a question about the task: answer it
- If it's requesting something dangerous: reject
- If it's stuck or erroring repeatedly: abort

Respond with JSON: { "action": "approve|reject|respond|abort", "response": "text to send" }`;

  const result = await callLLM(systemPrompt, cliOutput, { model: 'haiku' });
  return JSON.parse(result);
}
```

### Model Selection by State

Use cheaper models for simple decisions:

```typescript
function getModelForState(state: string): string {
  switch (state) {
    case 'permission_prompt':   return 'haiku';   // Simple y/n
    case 'interactive_menu':    return 'haiku';   // Pick an option
    case 'question':            return 'sonnet';  // Needs understanding
    case 'error':               return 'haiku';   // Simple triage
    default:                    return 'haiku';
  }
}
```

### Grace Period & Cooldown

Don't intervene too quickly — let the agent work:

```typescript
const INITIAL_GRACE_PERIOD = 30_000;   // 30s — let agent boot + start
const COOLDOWN_AFTER_RESPONSE = 20_000; // 20s — let agent process our input
const IDLE_THRESHOLD = 15_000;          // 15s of no output = idle

let promptSentAt = Date.now();
let lastResponseAt = 0;

// In the polling loop:
const elapsed = Date.now() - promptSentAt;
const sinceLastResponse = Date.now() - lastResponseAt;

// Don't intervene during grace period
if (elapsed < INITIAL_GRACE_PERIOD) continue;

// Don't intervene right after a response
if (sinceLastResponse < COOLDOWN_AFTER_RESPONSE) continue;
```

---

## Error Handling & Circuit Breaker

### Timeout

```typescript
// Kill after 30 minutes (configurable)
const MAX_SESSION_MS = 30 * 60 * 1000;

setTimeout(() => {
  proc.kill('SIGTERM');
  setTimeout(() => proc.kill('SIGKILL'), 5000);
}, MAX_SESSION_MS);
```

### Abort Signal (Cancellation)

```typescript
function spawnWithAbort(command, args, opts) {
  const proc = spawn(command, args, opts);

  // Check abort condition every 2 seconds
  const interval = setInterval(() => {
    if (shouldAbort()) {
      proc.kill('SIGTERM');
      setTimeout(() => proc.kill('SIGKILL'), 5000);
      clearInterval(interval);
    }
  }, 2000);

  proc.on('close', () => clearInterval(interval));
  return proc;
}
```

### Circuit Breaker

Prevents infinite retry loops when the agent keeps failing:

```typescript
class CircuitBreaker {
  private noProgressCount = 0;
  private sameErrorCount = 0;
  private lastErrorText = '';
  private state: 'closed' | 'half_open' | 'open' = 'closed';
  private openedAt = 0;

  static NO_PROGRESS_THRESHOLD = 3;
  static SAME_ERROR_THRESHOLD = 5;
  static COOLDOWN_MS = 10 * 60 * 1000;  // 10 minutes

  record(result: { filesChanged: number; hasError: boolean; errorText?: string }) {
    if (result.filesChanged > 0) {
      // Progress! Reset counters.
      this.noProgressCount = 0;
      this.sameErrorCount = 0;
      this.state = 'closed';
      return;
    }

    this.noProgressCount++;

    if (result.hasError && result.errorText === this.lastErrorText) {
      this.sameErrorCount++;
    } else if (result.hasError) {
      this.sameErrorCount = 1;
      this.lastErrorText = result.errorText || '';
    }

    if (this.noProgressCount >= CircuitBreaker.NO_PROGRESS_THRESHOLD ||
        this.sameErrorCount >= CircuitBreaker.SAME_ERROR_THRESHOLD) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  canProceed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.openedAt > CircuitBreaker.COOLDOWN_MS) {
        this.state = 'half_open';
        return true;  // Allow one retry
      }
      return false;  // Still cooling down
    }
    return true;  // half_open: allow one try
  }
}
```

---

## Swarm Mode (Boss + Workers)

Run multiple agents in parallel with a coordinator.

### Architecture

```
Boss Agent (persistent claude session)
  ├── Analyzes repo
  ├── Creates tasks: ASSIGN_TASK: developer | Add auth | feature | high
  │
  ├── Worker 1 (developer) ──► claude -p "Add auth" --output-format json
  ├── Worker 2 (tester) ──────► claude -p "Write tests" --output-format json
  ├── Worker 3 (security) ────► claude -p "Audit auth" --output-format json
  │
  ├── Reviews results (--resume to maintain context)
  ├── Assigns more tasks or declares SWARM_COMPLETE
  └── Done
```

### Task Assignment Output Format

The boss agent outputs task assignments as markers:

```
ASSIGN_TASK: developer | Add JWT authentication | feature | high
ASSIGN_TASK: tester | Write unit tests for auth module | feature | medium
ASSIGN_TASK: security-engineer | Audit login endpoint | security | high
```

Parse them:

```typescript
function parseTaskAssignments(output: string): Array<{
  agentId: string;
  task: string;
  type: string;
  priority: string;
}> {
  const regex = /^ASSIGN_TASK:\s*(\S+)\s*\|\s*(.+?)\s*\|\s*(\w+)\s*\|\s*(\w+)$/gm;
  const tasks: any[] = [];
  let match;

  while ((match = regex.exec(output))) {
    tasks.push({
      agentId: match[1],
      task: match[2],
      type: match[3],
      priority: match[4],
    });
  }

  return tasks;
}
```

### Worker Pool

```typescript
class WorkerPool {
  private maxConcurrency: number;
  private running = new Map<string, ChildProcess>();

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  get availableSlots(): number {
    return this.maxConcurrency - this.running.size;
  }

  async startWorker(task: { agentId: string; prompt: string; repoPath: string }) {
    if (this.availableSlots <= 0) return;

    const args = buildArgs('claude', task.prompt, { outputFormat: 'json' });
    const proc = spawn('claude', args, { cwd: task.repoPath });
    proc.stdin.end();

    this.running.set(task.agentId, proc);

    const output = await collectOutput(proc);
    this.running.delete(task.agentId);

    return output;
  }
}
```

---

## Sub-Agent Delegation

An agent can request spawning another agent via output markers:

```
INVOKE_AGENT: tester | Write comprehensive unit tests for the auth module
INVOKE_AGENT: security-engineer | Review the auth implementation for vulnerabilities
```

### Parse & Execute

```typescript
function parseInvocations(output: string): Array<{ agentId: string; task: string }> {
  const regex = /^INVOKE_AGENT:\s*(\S+)\s*\|\s*(.+)$/gm;
  const results: any[] = [];
  let match;
  while ((match = regex.exec(output))) {
    results.push({ agentId: match[1], task: match[2] });
  }
  return results;
}

// Depth limit to prevent infinite delegation
const MAX_DEPTH = 3;

async function delegateToAgent(
  agentId: string,
  task: string,
  repoPath: string,
  depth: number,
): Promise<string> {
  if (depth >= MAX_DEPTH) {
    return 'ERROR: Max delegation depth reached';
  }

  const prompt = `## Delegated Task\n\n${task}\n\nDelegation depth: ${depth + 1}/${MAX_DEPTH}`;
  const args = buildArgs('claude', prompt, { outputFormat: 'json' });
  const output = await spawnAndCollect('claude', args, repoPath);
  const parsed = parseOutput(output.stdout, output.exitCode);

  // Check if this agent also wants to delegate
  const subInvocations = parseInvocations(parsed.result);
  for (const sub of subInvocations) {
    await delegateToAgent(sub.agentId, sub.task, repoPath, depth + 1);
  }

  return parsed.result;
}
```

---

## Config Merging (3-Level)

Configuration is merged in 3 layers:

```
DEFAULTS (hardcoded)
  ↓ merge
GLOBAL CONFIG (~/.codeadvocate/config.json → agentDriver section)
  ↓ merge
PER-AGENT CONFIG (from agent.yml → agentDriverConfig section)
  = FINAL CONFIG
```

### Default Config

```typescript
const DEFAULTS = {
  command: 'agent',
  args: [],
  env: {},
  idleThresholdMs: 15_000,           // 15s silence = idle
  maxSessionTimeMs: 30 * 60 * 1000,  // 30 min timeout
  initialGracePeriodMs: 30_000,       // 30s boot grace
  cooldownAfterResponseMs: 20_000,    // 20s after supervisor response
  idleExitThreshold: 3,               // 3 idle rounds → exit
  gitIdleExitThreshold: 3,            // 3 rounds no file changes → exit
  autoApprovePatterns: [
    'read_file', 'search_files', 'list_files',
    'git status', 'git diff', 'git log',
    'ls', 'cat', 'npm test',
  ],
  mode: 'auto',
  allowedTools: ['Write', 'Read', 'Edit', 'Glob', 'Grep', 'Bash(git *)'],
  outputFormat: 'json',
};
```

### Merge Function

```typescript
function mergeConfig(
  defaults: Config,
  global?: Partial<Config>,
  perAgent?: Partial<Config>,
): Config {
  const merged = { ...defaults };

  // Layer 1: global overrides
  if (global) {
    if (global.command) merged.command = global.command;
    if (global.args) merged.args = [...merged.args, ...global.args];
    if (global.env) merged.env = { ...merged.env, ...global.env };
    if (global.maxSessionTimeMs) merged.maxSessionTimeMs = global.maxSessionTimeMs;
    // ... all other fields
  }

  // Layer 2: per-agent overrides (highest priority)
  if (perAgent) {
    if (perAgent.command) merged.command = perAgent.command;
    if (perAgent.args) merged.args = [...merged.args, ...perAgent.args];
    if (perAgent.env) merged.env = { ...merged.env, ...perAgent.env };
    // ... all other fields
  }

  // Inject git identity as env vars
  if (merged.gitIdentity?.name) {
    merged.env.GIT_AUTHOR_NAME = merged.gitIdentity.name;
    merged.env.GIT_COMMITTER_NAME = merged.gitIdentity.name;
  }
  if (merged.gitIdentity?.email) {
    merged.env.GIT_AUTHOR_EMAIL = merged.gitIdentity.email;
    merged.env.GIT_COMMITTER_EMAIL = merged.gitIdentity.email;
  }

  return merged;
}
```

---

## Step-by-Step: Build Your Own Integration

### Minimal Integration (5 steps)

```
1. Install claude CLI:        npm i -g @anthropic-ai/claude-code
2. Spawn with -p + --output-format json
3. Close stdin immediately
4. Collect stdout, parse JSON
5. Extract result + session_id
```

### Production Integration (full)

```
 1. Detect CLI type (claude vs agent)
 2. Build flags for that CLI type
 3. Set up MCP config (.mcp.json) if needed
 4. Set git identity env vars
 5. Write prompt to temp file (for long prompts)
 6. Spawn process with timeout + abort signal
 7. Close stdin
 8. Collect stdout + stderr
 9. Kill on timeout (SIGTERM → SIGKILL)
10. Parse JSON output
11. Normalize across CLI formats
12. Extract structured markers (STATUS, CHANGES, etc.)
13. Convert STATUS: failed → retry
14. Save session_id for --resume
15. Clean up temp files + .mcp.json
16. Record in circuit breaker
17. Retry if STATUS: retry (up to max_retries)
```

---

## Complete Working Example (Node.js)

```typescript
import { spawn, type ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ── Types ──

interface AgentResult {
  result: string;
  isError: boolean;
  sessionId?: string;
  turns: number;
  inputTokens: number;
  outputTokens: number;
  markers: Record<string, string>;
}

interface AgentOptions {
  command?: string;            // 'claude' | 'agent' | full path
  repoPath: string;
  prompt: string;
  systemContext?: string;      // Extra context (company, knowledge)
  tools?: string[];            // Allowed tools
  sessionId?: string;          // Resume from previous session
  timeoutMs?: number;          // Max execution time (default: 30min)
  gitIdentity?: { name: string; email: string };
}

// ── CLI Detection ──

function detectCLI(command: string): 'claude' | 'agent' {
  const base = command.split('/').pop()?.toLowerCase() ?? '';
  if (base === 'claude' || base === 'claude-code') return 'claude';
  return 'agent';
}

// ── Argument Building ──

function buildArgs(command: string, opts: AgentOptions): string[] {
  const cliType = detectCLI(command);
  const args: string[] = [];

  if (cliType === 'claude') {
    args.push('-p', opts.prompt);
    args.push('--output-format', 'json');
    if (opts.tools?.length) args.push('--allowedTools', opts.tools.join(','));
    if (opts.sessionId) args.push('--resume', opts.sessionId);
    if (opts.systemContext) args.push('--append-system-prompt', opts.systemContext);
  } else {
    const fullPrompt = opts.systemContext
      ? `<context>\n${opts.systemContext}\n</context>\n\n${opts.prompt}`
      : opts.prompt;
    args.push('-p', fullPrompt);
    args.push('--output-format', 'json');
    args.push('--trust');
    args.push('--force');
    if (opts.sessionId) args.push('--resume', opts.sessionId);
  }

  return args;
}

// ── Output Parsing ──

function parseJSON(stdout: string, exitCode: number): AgentResult {
  let parsed: any;
  try { parsed = JSON.parse(stdout); } catch { parsed = { result: stdout }; }

  // Normalize Cursor Agent format
  if (parsed.type === 'result') {
    if (parsed.is_error === undefined && parsed.subtype === 'error') parsed.is_error = true;
    if (!parsed.num_turns && parsed.duration_ms) {
      parsed.num_turns = Math.max(1, Math.round(parsed.duration_ms / 10000));
    }
  }

  let resultText = parsed.result ?? stdout;

  // Convert STATUS: failed → retry (recoverable errors)
  if (/^STATUS:\s*failed/m.test(resultText)) {
    resultText = resultText.replace(/^(STATUS:\s*)failed/m, '$1retry');
  }

  // Extract structured markers
  const markers: Record<string, string> = {};
  for (const line of resultText.split('\n')) {
    const m = line.match(/^([A-Z_]+):\s*(.+)$/);
    if (m) markers[m[1]] = m[2].trim();
  }

  return {
    result: resultText,
    isError: parsed.is_error ?? (exitCode !== 0),
    sessionId: parsed.session_id,
    turns: parsed.num_turns ?? 0,
    inputTokens: parsed.usage?.input_tokens ?? 0,
    outputTokens: parsed.usage?.output_tokens ?? 0,
    markers,
  };
}

// ── Main: Run Agent ──

export async function runAgent(opts: AgentOptions): Promise<AgentResult> {
  const command = opts.command || 'claude';
  const args = buildArgs(command, opts);
  const timeoutMs = opts.timeoutMs || 30 * 60 * 1000;

  // Build env with git identity override
  const env: Record<string, string> = { ...process.env as any };
  if (opts.gitIdentity) {
    env.GIT_AUTHOR_NAME = opts.gitIdentity.name;
    env.GIT_COMMITTER_NAME = opts.gitIdentity.name;
    env.GIT_AUTHOR_EMAIL = opts.gitIdentity.email;
    env.GIT_COMMITTER_EMAIL = opts.gitIdentity.email;
  }

  // Spawn
  const proc = spawn(command, args, {
    cwd: opts.repoPath,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  proc.stdin!.end();  // Non-interactive: close stdin

  // Collect output
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  proc.stdout!.on('data', (d) => stdoutChunks.push(d.toString()));
  proc.stderr!.on('data', (d) => stderrChunks.push(d.toString()));

  // Timeout
  let killed = false;
  const timer = setTimeout(() => {
    killed = true;
    proc.kill('SIGTERM');
    setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} }, 5000);
  }, timeoutMs);

  // Wait for exit
  const exitCode = await new Promise<number>((resolve) => {
    proc.on('close', (code) => { clearTimeout(timer); resolve(code ?? 1); });
  });

  if (killed) {
    return {
      result: `Agent timed out after ${timeoutMs / 1000}s`,
      isError: true,
      turns: 0,
      inputTokens: 0,
      outputTokens: 0,
      markers: { STATUS: 'retry' },
    };
  }

  return parseJSON(stdoutChunks.join(''), exitCode);
}

// ── Usage Example ──

async function main() {
  // Step 1: Plan
  const planResult = await runAgent({
    repoPath: '/path/to/project',
    prompt: `You are a planner. Break down this task into stories:
TASK: Add user authentication with JWT

Output:
STATUS: done
STORIES_JSON: [{"id": "S-1", "title": "...", "description": "..."}]
PLAN_SUMMARY: brief summary`,
    tools: ['Read', 'Glob', 'Grep'],
  });

  console.log('Plan status:', planResult.markers.STATUS);
  console.log('Session ID:', planResult.sessionId);

  // Step 2: Implement (resume same session)
  const devResult = await runAgent({
    repoPath: '/path/to/project',
    prompt: `Now implement story S-1 from the plan.

Output:
STATUS: done
CHANGES: list of changed files
COMMIT: commit hash`,
    sessionId: planResult.sessionId,  // Continue conversation
    tools: ['Read', 'Write', 'Edit', 'Bash(git *)', 'Bash(npm *)'],
    gitIdentity: { name: 'My App', email: 'app@example.com' },
  });

  console.log('Dev status:', devResult.markers.STATUS);
  console.log('Changes:', devResult.markers.CHANGES);
}

main().catch(console.error);
```

---

## Complete Working Example (Python)

```python
import subprocess
import json
import re
import os
import tempfile
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class AgentResult:
    result: str
    is_error: bool
    session_id: Optional[str] = None
    turns: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    markers: dict = field(default_factory=dict)

def detect_cli(command: str) -> str:
    basename = os.path.basename(command).lower()
    if basename in ('claude', 'claude-code'):
        return 'claude'
    return 'agent'

def build_args(command: str, prompt: str, *,
               tools: list[str] | None = None,
               session_id: str | None = None,
               system_context: str | None = None) -> list[str]:
    cli_type = detect_cli(command)
    args = []

    if cli_type == 'claude':
        args.extend(['-p', prompt])
        args.extend(['--output-format', 'json'])
        if tools:
            args.extend(['--allowedTools', ','.join(tools)])
        if session_id:
            args.extend(['--resume', session_id])
        if system_context:
            args.extend(['--append-system-prompt', system_context])
    else:
        full_prompt = f"<context>\n{system_context}\n</context>\n\n{prompt}" if system_context else prompt
        args.extend(['-p', full_prompt])
        args.extend(['--output-format', 'json'])
        args.extend(['--trust', '--force'])
        if session_id:
            args.extend(['--resume', session_id])

    return args

def parse_output(stdout: str, exit_code: int) -> AgentResult:
    try:
        parsed = json.loads(stdout)
    except json.JSONDecodeError:
        parsed = {'result': stdout}

    # Normalize Cursor format
    if parsed.get('type') == 'result':
        if parsed.get('is_error') is None and parsed.get('subtype') == 'error':
            parsed['is_error'] = True

    result_text = parsed.get('result', stdout)

    # Convert STATUS: failed → retry
    result_text = re.sub(r'^(STATUS:\s*)failed', r'\1retry', result_text, flags=re.MULTILINE)

    # Extract markers
    markers = {}
    for line in result_text.split('\n'):
        m = re.match(r'^([A-Z_]+):\s*(.+)$', line)
        if m:
            markers[m.group(1)] = m.group(2).strip()

    return AgentResult(
        result=result_text,
        is_error=parsed.get('is_error', exit_code != 0),
        session_id=parsed.get('session_id'),
        turns=parsed.get('num_turns', 0),
        input_tokens=(parsed.get('usage') or {}).get('input_tokens', 0),
        output_tokens=(parsed.get('usage') or {}).get('output_tokens', 0),
        markers=markers,
    )

def run_agent(
    repo_path: str,
    prompt: str,
    command: str = 'claude',
    tools: list[str] | None = None,
    session_id: str | None = None,
    system_context: str | None = None,
    timeout: int = 1800,
    git_identity: dict | None = None,
) -> AgentResult:
    args = build_args(command, prompt,
                      tools=tools,
                      session_id=session_id,
                      system_context=system_context)

    env = os.environ.copy()
    if git_identity:
        env['GIT_AUTHOR_NAME'] = git_identity['name']
        env['GIT_COMMITTER_NAME'] = git_identity['name']
        env['GIT_AUTHOR_EMAIL'] = git_identity['email']
        env['GIT_COMMITTER_EMAIL'] = git_identity['email']

    proc = subprocess.run(
        [command] + args,
        cwd=repo_path,
        capture_output=True,
        text=True,
        timeout=timeout,
        env=env,
        stdin=subprocess.DEVNULL,  # Close stdin
    )

    return parse_output(proc.stdout, proc.returncode)


# ── Usage ──

if __name__ == '__main__':
    # Step 1: Plan
    plan = run_agent(
        repo_path='/path/to/project',
        prompt='''You are a planner. Break down this task:
TASK: Add user authentication

Output:
STATUS: done
PLAN_SUMMARY: brief summary''',
        tools=['Read', 'Glob', 'Grep'],
    )
    print(f"Plan: {plan.markers.get('STATUS')}")
    print(f"Session: {plan.session_id}")

    # Step 2: Implement (resume session)
    dev = run_agent(
        repo_path='/path/to/project',
        prompt='''Implement the planned feature.

Output:
STATUS: done
CHANGES: files changed''',
        session_id=plan.session_id,
        tools=['Read', 'Write', 'Edit', 'Bash(git *)', 'Bash(npm *)'],
        git_identity={'name': 'My App', 'email': 'app@example.com'},
    )
    print(f"Dev: {dev.markers.get('STATUS')}")
    print(f"Changes: {dev.markers.get('CHANGES')}")
```

---

## Key Takeaways

1. **Spawn with stdin closed** — the agent runs autonomously, no user input needed
2. **Use `--output-format json`** — structured output you can parse programmatically
3. **Claude vs Agent flags differ** — Claude supports `--allowedTools` and `--append-system-prompt`, Agent/Cursor does not
4. **Session continuity via `--resume`** — multi-step workflows maintain conversation context
5. **Extract markers from result text** — `STATUS: done`, `CHANGES: ...`, `PR_URL: ...`
6. **Convert `failed` → `retry`** — let your retry logic handle recoverable errors
7. **Circuit breaker** — stop retrying after 3 rounds of no progress or 5 identical errors
8. **Git identity env vars** — override commit author to keep your app's branding
9. **MCP via `.mcp.json`** — inject additional tools (temporary file, cleaned up after)
10. **Timeout + SIGTERM → SIGKILL** — always have a kill switch
