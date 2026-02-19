import parse from 'parse-duration';

declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

function getEnvVar(key: string): string | undefined {
  if (typeof window !== 'undefined' && window.__ENV__ !== undefined) {
    // In the browser, window.__ENV__ is the source of truth.
    return window.__ENV__[key];
  }
  // Dynamic key access prevents Next.js from inlining at build time.
  return process.env[key];
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
