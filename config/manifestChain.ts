import { AssetList, Chain, IBCInfo } from '@chain-registry/types';

import env from './env';

const buildType = env.chainTier;
let manifestModule: {
  assets: AssetList;
  chain: Chain;
  ibc?: IBCInfo[];
};

if (buildType === 'qa') {
  manifestModule = require('chain-registry/devnet/manifestdevnet');
} else if (buildType === 'testnet') {
  manifestModule = require('chain-registry/testnet/manifesttestnet');
} else {
  manifestModule = require('chain-registry/mainnet/manifest');
}

let manifestAssets: AssetList, manifestChain: Chain, manifestIbc: IBCInfo[];

if (buildType === 'qa') {
  const { assets, chain } = manifestModule;
  manifestAssets = assets;
  manifestChain = chain;
  manifestIbc = []; // Default value since devnet doesn't include ibc
} else if (buildType === 'testnet') {
  const { assets, chain, ibc } = manifestModule;
  // Merge the ibcAssets into the manifestAssets
  manifestAssets = assets;
  manifestChain = chain;
  manifestIbc = ibc!;
} else {
  const { assets, chain, ibc } = manifestModule;
  manifestAssets = assets;
  manifestChain = chain;
  manifestIbc = ibc!;
}

// The chain accepts PWR for fees on mainnet and testnet (node minimum gas price is
// 0.37 upwr), but the pinned chain-registry only lists umfx. Add PWR after umfx so
// MFX stays the preferred fee token. chain-registry 1.69.723 already includes it.
if (
  buildType !== 'qa' &&
  !manifestChain.fees?.fee_tokens.some(t => t.denom === env.pwrTokenDenom)
) {
  manifestChain = {
    ...manifestChain,
    fees: {
      fee_tokens: [
        ...(manifestChain.fees?.fee_tokens ?? []),
        {
          denom: env.pwrTokenDenom,
          fixed_min_gas_price: 0.37,
          low_gas_price: 0.4,
          average_gas_price: 0.5,
          high_gas_price: 1,
        },
      ],
    },
  };
}

export { manifestAssets, manifestChain, manifestIbc };
