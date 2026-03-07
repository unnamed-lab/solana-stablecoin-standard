# SSS Terminal UI

> **Interactive terminal dashboard for the Solana Stablecoin Standard.**  
> Monitor supply metrics, manage compliance, govern webhooks, and stream live events — all from your terminal.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the TUI](#running-the-tui)
- [Navigation](#navigation)
- [Screens](#screens)
  - [1 · Token Ops](#1--token-ops)
  - [2 · Compliance](#2--compliance)
  - [3 · Audit Log](#3--audit-log)
  - [4 · Webhooks](#4--webhooks)
  - [5 · Live Feed](#5--live-feed)
- [Development Setup](#development-setup)
- [Contributing](#contributing)

---

## Overview

The SSS Terminal UI is a keyboard-driven React/Ink application that provides an at-a-glance view of a running stablecoin deployment. It connects to the SSS backend API over HTTP, so the API server must be running for full functionality.

Built with [Ink](https://github.com/vadimdemedes/ink) — React for interactive command-line apps.

---

## Features

| Screen | Capabilities |
|--------|-------------|
| **Token Ops** | Live supply dashboard (auto-refreshes every 10s), mint tokens, burn tokens, view active minters, view top 10 holders |
| **Compliance** | View blacklist, add/remove addresses, check status, seize tokens from frozen accounts |
| **Audit Log** | Browse paginated on-chain audit history |
| **Webhooks** | Register, toggle active/paused, and delete webhook endpoints |
| **Live Feed** | Real-time event stream of all stablecoin activity |

- Fully keyboard-driven — no mouse required
- Numbered tab navigation (`1`–`5`) + arrow key support
- Tab/Enter form navigation within screens
- Spinner indicators while awaiting API responses
- Color-coded status: green = success, yellow = warnings, red = errors

---

## Prerequisites

- Node.js ≥ 18
- Yarn
- The **SSS API** backend running and accessible (default: `http://localhost:3000`)

---

## Installation & Setup

```bash
# From the monorepo root
cd tui

# Install dependencies
yarn install

# Copy the environment template
cp .env.example .env
```

---

## Environment Configuration

Edit `.env` with your deployment details:

```env
# Base URL of the SSS backend API
API_BASE_URL=http://localhost:3000

# Path to the minter keypair JSON (used by the Mint screen)
MINTER_KEYPAIR=/path/to/minter.json

# Path to the burner keypair JSON (used by the Burn screen)
BURNER_KEYPAIR=/path/to/burner.json
```

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | HTTP base URL of the SSS API server (no trailing slash) |
| `MINTER_KEYPAIR` | Path to a Solana keypair JSON file with minting authority |
| `BURNER_KEYPAIR` | Path to a Solana keypair JSON file with burning authority |

---

## Running the TUI

```bash
# Development (uses tsx, no build step)
yarn dev

# Or via start alias
yarn start
```

> **Note:** Your terminal must support ANSI colors and have a width of at least 80 characters for the best experience.

---

## Navigation

### Global Keys

| Key | Action |
|-----|--------|
| `1` | Switch to **Token Ops** screen |
| `2` | Switch to **Compliance** screen |
| `3` | Switch to **Audit Log** screen |
| `4` | Switch to **Webhooks** screen |
| `5` | Switch to **Live Feed** screen |
| `←` / `→` | Navigate screens with arrow keys |
| `q` | Quit the application |

### Form Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next input field |
| `Enter` | Submit form (on last field) or advance to next field |

---

## Screens

### 1 · Token Ops

Press `1` to open. Sub-views are accessed with single-key shortcuts:

| Key | Sub-view | Description |
|-----|----------|-------------|
| `d` | Dashboard | Live supply metrics (total supply, burned, max supply, decimals). Auto-refreshes every 10 seconds |
| `m` | Mint | Form to mint tokens to a recipient address and amount |
| `b` | Burn | Form to burn a specified token amount |
| `h` | Holders | Table of the top 10 largest token holders (address + balance) |
| `i` | Minters | Table of the active minter authorities and notes |

**Dashboard** auto-polls the API every 10 seconds without any user interaction. A spinner is shown while loading.

---

### 2 · Compliance

Press `2` to open. Sub-views:

| Key | Sub-view | Description |
|-----|----------|-------------|
| `l` | Blacklist | Table of all blacklisted addresses with reason and date added |
| `a` | Add | Form to blacklist a wallet address with a mandatory reason |
| `r` | Remove | Form to remove a wallet from the blacklist |
| `c` | Check | Enter any address to instantly check if it is blacklisted |
| `s` | Seize | Seize tokens from a frozen account — requires source, destination, amount, and reason |

**Seize form fields** (Tab to advance, Enter on the last field to submit):
1. `Source` — frozen token account to seize from
2. `Destination` — Token account to receive the seized funds
3. `Amount` — Amount in base units
4. `Reason` — Documented reason for the seizure

---

### 3 · Audit Log

Press `3` to open.

Displays a paginated history of all on-chain audit events (mints, burns, freezes, compliance actions, role changes, etc.) fetched from the API. Use arrow keys to scroll through entries.

---

### 4 · Webhooks

Press `4` to open. Sub-views:

| Key | Sub-view | Description |
|-----|----------|-------------|
| `l` | List | All registered webhooks with URL, active status, and subscribed events. Use `↑`/`↓` to navigate; press `Enter` to toggle a webhook active/paused |
| `a` | Add | Register a new webhook with URL, signing secret, and comma-separated event types |
| `x` | Delete | Select a webhook to delete; confirm with `y`, cancel with `n` |

**Add Webhook form fields**:
1. `URL` — HTTPS endpoint to deliver events to
2. `Secret` — Signing secret for HMAC verification
3. `Events` — Comma-separated event names (e.g. `Minted,Burned,Seized,Blacklisted`)

**Toggle** — From the list view, pressing `Enter` on any webhook flips its `active` state without leaving the screen.

---

### 5 · Live Feed

Press `5` to open.

Streams real-time events from the SSS API (server-sent events or polling). New activity appears at the top of the screen, with timestamps and event types color-coded by category.

---

## Development Setup

### Prerequisites

- Node.js ≥ 18
- Yarn

### Steps

```bash
# 1. Clone the monorepo
git clone https://github.com/solanabr/solana-stablecoin-standard.git
cd sss/tui

# 2. Install dependencies
yarn install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API URL and keypair paths

# 4. Start the TUI
yarn dev
```

### Project Structure

```
tui/
├── src/
│   ├── index.tsx           # Entry point — renders <App />
│   ├── App.tsx             # Root component: tab bar + screen switcher
│   ├── api.ts              # All HTTP calls to the SSS backend
│   ├── terminal-ui.jsx     # Legacy/alternate UI entrypoint
│   └── screens/
│       ├── TokenOps.tsx    # Supply dashboard, mint, burn, holders
│       ├── Compliance.tsx  # Blacklist management & seizure
│       ├── AuditLog.tsx    # Paginated audit history
│       ├── WebhookManager.tsx  # Webhook CRUD + toggle
│       └── LiveFeed.tsx    # Real-time event stream
├── .env.example
├── package.json
└── tsconfig.json
```

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `ink` | React renderer for terminal UIs |
| `ink-text-input` | Text input components |
| `ink-select-input` | Selection lists |
| `ink-spinner` | Loading spinners |
| `ink-table` | Table rendering |
| `react` | Component model |
| `axios` | HTTP client for API calls |
| `dotenv` | `.env` file loading |
| `tsx` | TypeScript execution without compile step |

### Useful Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start TUI in development mode (hot-reloading via `tsx`) |
| `yarn start` | Alias for `yarn dev` |
| `yarn build` | Compile TypeScript to `dist/` |

---

## Contributing

1. **Fork** the repository and create a branch: `git checkout -b feat/my-screen`
2. New screen? Create a file in `src/screens/YourScreen.tsx`
3. Register the screen in `App.tsx` inside the `SCREENS` array:
   ```tsx
   import YourScreen from './screens/YourScreen.js';

   const SCREENS = [
     // ...existing screens
     { key: "6", label: "Your Screen", Component: YourScreen },
   ] as const;
   ```
4. Add any necessary API calls to `src/api.ts`
5. Test manually with `yarn dev`, then submit a **pull request**

### Adding an API Call

```typescript
// src/api.ts
export async function myNewCall(param: string): Promise<MyReturnType> {
    const res = await api.get(`/my-endpoint/${param}`);
    return res.data;
}
```

The `api` object is a pre-configured `axios` instance pointing to `API_BASE_URL` from `.env`.

### Screen Template

```tsx
import { useState } from "react";
import { Box, Text, useInput } from "ink";

export default function MyScreen() {
  const [view, setView] = useState<"main" | "detail">("main");

  useInput((input) => {
    if (input === "m") setView("main");
    if (input === "d") setView("detail");
  });

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold color="yellow">My Screen</Text>
        <Text dimColor>│</Text>
        <Text color={view === "main" ? "green" : "gray"}>[m] Main</Text>
        <Text color={view === "detail" ? "green" : "gray"}>[d] Detail</Text>
      </Box>
      {view === "main" && <MainView />}
      {view === "detail" && <DetailView />}
    </Box>
  );
}
```

---

> Built on the [Solana Stablecoin Standard](https://github.com/solanabr/solana-stablecoin-standard) · Powered by [Ink](https://github.com/vadimdemedes/ink)
