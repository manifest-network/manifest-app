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

export { manifestAssets, manifestChain, manifestIbc };
