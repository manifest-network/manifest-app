import parse from 'parse-duration';

// Literal `process.env.NEXT_PUBLIC_*` references so Next.js inlines them into the client
// bundle at build time. This keeps `bun dev`, `next build && next start` and any non-Docker
// deploy working from a normal .env. In Docker images, values passed at container start
// (written to window.__ENV__ by docker-entrypoint.mjs) take precedence over these.
const buildTimeEnv = {
  NEXT_PUBLIC_WALLETCONNECT_KEY: process.env.NEXT_PUBLIC_WALLETCONNECT_KEY,
  NEXT_PUBLIC_WEB3AUTH_NETWORK: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK,
  NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
  NEXT_PUBLIC_CHAIN: process.env.NEXT_PUBLIC_CHAIN,
  NEXT_PUBLIC_OSMOSIS_CHAIN: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_OSMOSIS_CHAIN_ID: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN_ID,
  NEXT_PUBLIC_LEAP_DEEPLINK: process.env.NEXT_PUBLIC_LEAP_DEEPLINK,
  NEXT_PUBLIC_CHAIN_TIER: process.env.NEXT_PUBLIC_CHAIN_TIER,
  NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
  NEXT_PUBLIC_OSMOSIS_EXPLORER_URL: process.env.NEXT_PUBLIC_OSMOSIS_EXPLORER_URL,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_INDEXER_URL: process.env.NEXT_PUBLIC_INDEXER_URL,
  NEXT_PUBLIC_OSMOSIS_API_URL: process.env.NEXT_PUBLIC_OSMOSIS_API_URL,
  NEXT_PUBLIC_OSMOSIS_RPC_URL: process.env.NEXT_PUBLIC_OSMOSIS_RPC_URL,
  NEXT_PUBLIC_MINIMUM_VOTING_PERIOD: process.env.NEXT_PUBLIC_MINIMUM_VOTING_PERIOD,
  NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET: process.env.NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET,
  NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS,
};

type EnvKey = keyof typeof buildTimeEnv;

function getEnvVar(key: EnvKey): string | undefined {
  if (typeof window !== 'undefined') {
    // Browser: runtime values written by docker-entrypoint.mjs win; otherwise use the
    // build-time value. The committed placeholder (window.__ENV__ = {}) falls through here.
    return window.__ENV__?.[key] ?? buildTimeEnv[key];
  }
  // Server / tests: dynamic access reads the live environment.
  return process.env[key] ?? buildTimeEnv[key];
}

function parseDuration(duration: string | undefined, defaultValue: number): number {
  const d = parse(duration ?? '');
  if (d === null) {
    return defaultValue;
  }
  // Convert to seconds.
  return d / 1000;
}

const env = {
  production: process.env.NODE_ENV === 'production',

  // Wallet
  walletConnectKey: getEnvVar('NEXT_PUBLIC_WALLETCONNECT_KEY') ?? '',
  web3AuthNetwork: getEnvVar('NEXT_PUBLIC_WEB3AUTH_NETWORK') ?? '',
  web3AuthClientId: getEnvVar('NEXT_PUBLIC_WEB3AUTH_CLIENT_ID') ?? '',

  // Chains
  chain: getEnvVar('NEXT_PUBLIC_CHAIN') ?? '',
  osmosisChain: getEnvVar('NEXT_PUBLIC_OSMOSIS_CHAIN') ?? '',
  chainId: getEnvVar('NEXT_PUBLIC_CHAIN_ID') ?? '',
  osmosisChainId: getEnvVar('NEXT_PUBLIC_OSMOSIS_CHAIN_ID') ?? '',

  // Leap Deeplink
  leapDeeplink: getEnvVar('NEXT_PUBLIC_LEAP_DEEPLINK') ?? '',

  // Ops
  chainTier: getEnvVar('NEXT_PUBLIC_CHAIN_TIER') ?? '',

  // Explorer URLs
  explorerUrl: getEnvVar('NEXT_PUBLIC_EXPLORER_URL') ?? '',
  osmosisExplorerUrl: getEnvVar('NEXT_PUBLIC_OSMOSIS_EXPLORER_URL') ?? '',
  // RPC and API URLs
  rpcUrl: getEnvVar('NEXT_PUBLIC_RPC_URL') ?? '',
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL') ?? '',
  indexerUrl: getEnvVar('NEXT_PUBLIC_INDEXER_URL') ?? '',

  // Osmosis RPC URLs
  osmosisApiUrl: getEnvVar('NEXT_PUBLIC_OSMOSIS_API_URL') ?? '',
  osmosisRpcUrl: getEnvVar('NEXT_PUBLIC_OSMOSIS_RPC_URL') ?? '',

  // Frontend development specific variables.

  /**
   * Minimum allowed voting period for proposals. This is a number of seconds.
   * By default, it is set to 30 minutes.
   */
  minimumVotingPeriod: parseDuration(getEnvVar('NEXT_PUBLIC_MINIMUM_VOTING_PERIOD'), 1800),

  /**
   * Minimum block offset required when submitting a chain upgrade proposal. The chosen upgrade height must be at least this many blocks greater than the current block height at the time of proposal submission.
   * By default, it is set to 1000 blocks.
   */
  upgradeMinBlockOffset: parseInt(getEnvVar('NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET') ?? '1000', 10),

  mfxToPwrConversionContractAddress:
    getEnvVar('NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS') ?? '',

  pwrTokenDenom: 'factory/manifest1afk9zr2hn2jsac63h4hm60vl9z3e5u69gndzf7c99cqge3vzwjzsfmy9qj/upwr',
};

export default env;
