import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = {
    walletConnectKey: process.env.NEXT_PUBLIC_WALLETCONNECT_KEY ?? '',
    web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK ?? '',
    web3AuthClientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? '',
    chain: process.env.NEXT_PUBLIC_CHAIN ?? '',
    osmosisChain: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN ?? '',
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? '',
    osmosisChainId: process.env.NEXT_PUBLIC_OSMOSIS_CHAIN_ID ?? '',
    leapDeeplink: process.env.NEXT_PUBLIC_LEAP_DEEPLINK ?? '',
    chainTier: process.env.NEXT_PUBLIC_CHAIN_TIER ?? '',
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? '',
    osmosisExplorerUrl: process.env.NEXT_PUBLIC_OSMOSIS_EXPLORER_URL ?? '',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? '',
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
    indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? '',
    osmosisApiUrl: process.env.NEXT_PUBLIC_OSMOSIS_API_URL ?? '',
    osmosisRpcUrl: process.env.NEXT_PUBLIC_OSMOSIS_RPC_URL ?? '',
    minimumVotingPeriod: process.env.NEXT_PUBLIC_MINIMUM_VOTING_PERIOD ?? '',
    upgradeMinBlockOffset: process.env.NEXT_PUBLIC_UPGRADE_MIN_BLOCK_OFFSET ?? '1000',
    mfxToPwrConversionContractAddress:
      process.env.NEXT_PUBLIC_MFX_TO_PWR_CONVERSION_CONTRACT_ADDRESS ?? '',
  };

  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.status(200).json(config);
}
