<h1 align="center">Manifest Wallet</h1>

<p align="center">
  <img src="https://raw.githubusercontent.com/cosmos/chain-registry/00df6ff89abd382f9efe3d37306c353e2bd8d55c/manifest/images/manifest.png" alt="Manifest Network" width="100"/>
</p>

This is a web app that allows users to interact with the Manifest Network and its various modules.

For more information on the Manifest Network and its modules, please visit the [Manifest Network GitHub](https://github.com/manifest-network/manifest-ledger).

[![codecov](https://codecov.io/gh/manifest-network/manifest-app/branch/main/graph/badge.svg)](https://codecov.io/gh/manifest-network/manifest-app)

## Getting Started

### Installation

1. Clone the repository

   - `git clone https://github.com/manifest-network/manifest-app`
   - `cd manifest-app`

2. Install dependencies
   - `bun install`

### .env

```
NEXT_PUBLIC_WALLETCONNECT_KEY=
NEXT_PUBLIC_WEB3AUTH_NETWORK=
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=
NEXT_PUBLIC_CHAIN=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_CHAIN_TIER=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_EXPLORER_URL=
NEXT_PUBLIC_INDEXER_URL=
NEXT_PUBLIC_OSMOSIS_CHAIN_ID=
NEXT_PUBLIC_OSMOSIS_RPC_URL=
NEXT_PUBLIC_OSMOSIS_API_URL=
NEXT_PUBLIC_OSMOSIS_EXPLORER_URL=
NEXT_PUBLIC_LEAP_DEEPLINK=
NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET=
NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS=

```

where

- `NEXT_PUBLIC_WALLETCONNECT_KEY` is the WalletConnect key
- `NEXT_PUBLIC_WEB3AUTH_NETWORK` is the Web3Auth network to use for social login
- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` is the Web3Auth client ID to use for social login
- `NEXT_PUBLIC_CHAIN` is the chain name
- `NEXT_PUBLIC_CHAIN_ID` is the chain ID
- `NEXT_PUBLIC_CHAIN_TIER` is the chain tier (e.g., `testnet`, `mainnet`)
- `NEXT_PUBLIC_RPC_URL` is the chain RPC URL
- `NEXT_PUBLIC_API_URL` is the chain API URL
- `NEXT_PUBLIC_EXPLORER_URL` is the block explorer URL
- `NEXT_PUBLIC_INDEXER_URL` is the YACI indexer URL
- `NEXT_PUBLIC_OSMOSIS_CHAIN_ID` is the osmosis chain ID
- `NEXT_PUBLIC_OSMOSIS_RPC_URL` is the osmosis RPC URL
- `NEXT_PUBLIC_OSMOSIS_API_URL` is the osmosis API URL
- `NEXT_PUBLIC_OSMOSIS_EXPLORER_URL` is the osmosis block explorer URL
- `NEXT_PUBLIC_LEAP_DEEPLINK` is the leap deeplink
- `NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET` sets how many blocks in the future a chain upgrade height must be from the current block.
- `NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS` is the contract address for converting MFX to PWR

### Development

1. Start the server

   - `bun run dev`

2. Navigate to `http://localhost:3000` in your browser

### Production

1. Build the app

   - `bun run build`

2. Start the server

   - `bun run start`

3. Navigate to `http://localhost:3000` in your browser
