import parse from 'parse-duration';

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
  walletConnectKey: process.env.NEXT_PUBLIC_WALLETCONNECT_KEY ?? '',
  web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK ?? '',
  web3AuthClientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? '',

  // Chains
  chain: process.env.NEXT_PUBLIC_CHAIN ?? '',
  osmosisChain: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN ?? '',
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? '',
  osmosisChainId: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN_ID ?? '',

  // Leap Deeplink
  leapDeeplink: process.env.NEXT_PUBLIC_LEAP_DEEPLINK ?? '',

  // Ops
  chainTier: process.env.NEXT_PUBLIC_CHAIN_TIER ?? '',

  // Explorer URLs
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? '',
  osmosisExplorerUrl: process.env.NEXT_PUBLIC_OSMOSIS_EXPLORER_URL ?? '',
  // RPC and API URLs
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? '',

  // Osmosis RPC URLs
  osmosisApiUrl: process.env.NEXT_PUBLIC_OSMOSIS_API_URL ?? '',
  osmosisRpcUrl: process.env.NEXT_PUBLIC_OSMOSIS_RPC_URL ?? '',

  // Frontend development specific variables.

  /**
   * Minimum allowed voting period for proposals. This is a number of seconds.
   * By default, it is set to 30 minutes.
   */
  minimumVotingPeriod: parseDuration(process.env.NEXT_PUBLIC_MINIMUM_VOTING_PERIOD, 1800),

  /**
   * Minimum block offset required when submitting a chain upgrade proposal. The chosen upgrade height must be at least this many blocks greater than the current block height at the time of proposal submission.
   * By default, it is set to 1000 blocks.
   */
  upgradeMinBlockOffset: parseInt(process.env.NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET ?? '1000', 10),
};

export default env;
