# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manifest Wallet ("Alberto") — a Next.js 15 web app for interacting with the Manifest Network blockchain and its modules (groups, factory, bank, admins). Built with the Pages Router, Cosmos SDK tooling, and multi-chain support (Manifest + Osmosis).

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Dev server with Turbopack (localhost:3000)
bun run build            # Production build
bun run lint             # ESLint
bun run format           # Prettier (write mode)
bun test                 # Run all unit tests (Bun test runner)
bun test path/to/file    # Run a single test file
bun run test:coverage    # Tests with coverage report
```

Package manager is **Bun** (not npm/yarn). Use `bun install`, `bun run`, `bun test`.

## Architecture

### Routing & Pages

Next.js **Pages Router** (`pages/` directory). Dynamic routes: `pages/factory/[id].tsx`, `pages/groups/[id].tsx`.

### Provider Stack

`ManifestAppProviders` in `contexts/manifestAppProviders.tsx` composes the full provider tree:
`QueryClientProvider` → `ContactsProvider` → `Web3AuthProvider` → `ChainProvider` (cosmos-kit) → `ThemeProvider` → `ToastProvider`

### State Management

- **Server state**: TanStack React Query v5 — query hooks in `hooks/useQueries.ts`
- **Blockchain transactions**: `hooks/useTx.tsx`
- **LCD queries**: `hooks/useLcdQueryClient.ts`
- **Client state**: React Context (`contexts/`) for theme, toasts, advanced mode, web3auth
- **Form state**: Formik + Yup (schemas in `schemas/`)
- **Local persistence**: `hooks/useLocalStorage.ts`

### Component Organization

Feature-based directories under `components/`:
- `admins/`, `bank/`, `factory/`, `groups/`, `tokens/` — domain features
- `react/` — shared layout and UI components (Nav, Sidebar, etc.)
- `3js/` — Three.js visualizations (dynamically imported to avoid SSR issues)
- `icons/` — custom SVG icon components

### Blockchain Integration

- **@manifest-network/manifestjs** — proto-generated types, registries, amino converters
- **cosmos-kit** — wallet management (Keplr, Cosmostation, Leap, Web3Auth social login)
- **@cosmjs** — signing, stargate client, proto-signing
- Multi-chain: Manifest (primary) + Osmosis (IBC/swaps)

### Configuration

- `config/env.ts` — centralized env var access with defaults
- `config/manifestChain.ts` / `config/osmosisChain.ts` — chain registry, selected by `NEXT_PUBLIC_CHAIN_TIER` (qa/testnet/mainnet)
- `.env.test` for test environment variables

### Styling

Tailwind CSS v4 + DaisyUI v5. Dark/light theme via `data-theme` attribute. Custom breakpoints (`xxs: 320px`, `3xl: 2560px`).

## Code Conventions

- TypeScript strict mode
- Path alias: `@/*` maps to project root (e.g., `@/components`, `@/hooks`)
- Prettier: 100 char width, single quotes, es5 trailing commas, sorted imports (`@trivago/prettier-plugin-sort-imports`)
- Import order: `@/` prefixed paths first, then relative `.` paths, separated by blank line
- Tests co-located in `__tests__/` directories next to source files, using `*.test.tsx` pattern
- Test setup: happy-dom for DOM simulation, `@testing-library/react` + `@testing-library/jest-dom` matchers

## CI

GitHub Actions runs on push and PR: build check, test coverage (uploaded to Codecov), and Prettier formatting check. Docker builds trigger on `release/*` branches and version tags, deploying to GHCR with per-tier (qa/testnet/mainnet) environment configs.
