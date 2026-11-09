import { Asset, AssetList, IBCInfo } from '@chain-registry/types';
import { Coin } from '@manifest-network/manifestjs/dist/codegen/cosmos/base/v1beta1/coin';

import { manifestAssets, manifestIbc } from '@/config/manifestChain';
import { osmosisAssets, osmosisIbc } from '@/config/osmosisChain';

import { shiftDigits } from './maths';

const assets: AssetList[] = [manifestAssets, osmosisAssets];

export const truncateDenom = (denom: string) => {
  return denom.slice(0, 10) + '...' + denom.slice(-6);
};

const filterAssets = (chainName: string, assetList: AssetList[]): Asset[] => {
  return (
    assetList
      .find(({ chain_name }) => chain_name === chainName)
      ?.assets?.filter(({ type_asset }) => type_asset === 'ics20' || !type_asset) || []
  );
};

const getAllAssets = (chainName: string) => {
  const nativeAssets = filterAssets(chainName, assets);
  const ibcAssets = filterAssets(chainName, assets);

  return [...nativeAssets, ...ibcAssets];
};

export const denomToAsset = (chainName: string, denom: string) => {
  const allAssets = getAllAssets(chainName);
  // Only handle IBC hashes
  if (denom.startsWith('ibc/')) {
    // Find the asset that has this IBC hash as its base
    const asset = allAssets.find(asset => asset.base === denom);
    if (asset?.traces?.[0]?.counterparty?.base_denom) {
      // Return the original denom from the counterparty chain
      return {
        ...asset,
        base: asset.traces[0].counterparty.base_denom,
      };
    }
  }

  // Return original asset if not an IBC hash
  return allAssets.find(asset => asset.base === denom);
};

export const denomToExponent = (chainName: string, denom: string) => {
  const asset = denomToAsset(chainName, denom);
  const unit = asset?.denom_units.find(({ denom }) => denom === asset.display);
  return unit?.exponent ?? 6;
};

export const prettyBalance = (chainName: string, balance: Coin) => {
  const { amount, denom } = balance;
  const asset = denomToAsset(chainName, denom);
  const symbol = asset?.symbol || truncateDenom(denom);
  const exponent = denomToExponent(chainName, denom);
  const displayAmount = shiftDigits(amount, -exponent);
  const logoUrl = Object.values(asset?.logo_URIs || {}).find(url => url);

  return { denom, symbol, amount, displayAmount, logoUrl, exponent };
};

export type PrettyBalance = ReturnType<typeof prettyBalance>;

const ibcData: IBCInfo[] = [...manifestIbc, ...osmosisIbc];

export const getIbcInfo = (fromChainName: string, toChainName: string) => {
  let flipped = false;

  let ibcInfo = ibcData.find(
    i => i.chain_1.chain_name === fromChainName && i.chain_2.chain_name === toChainName
  );

  if (!ibcInfo) {
    ibcInfo = ibcData.find(
      i => i.chain_1.chain_name === toChainName && i.chain_2.chain_name === fromChainName
    );
    flipped = true;
  }

  if (!ibcInfo) {
    throw new Error('cannot find IBC info');
  }

  const key = flipped ? 'chain_2' : 'chain_1';
  const source_port = ibcInfo.channels[0][key].port_id;
  const source_channel = ibcInfo.channels[0][key].channel_id;

  return { source_port, source_channel };
};

export const getIbcDenom = (chainName: string, denom: string) => {
  const allAssets = getAllAssets(chainName);

  // Find the asset that has this denom as its counterparty base_denom
  const ibcAsset = allAssets.find(asset => asset.traces?.[0]?.counterparty?.base_denom === denom);

  // Return the IBC hash (base) if found
  return ibcAsset?.base;
};

export const normalizeIBCDenom = (chainName: string, denom: string) => {
  const asset = denomToAsset(chainName, denom);
  if (asset) {
    return {
      denom: asset.base,
    };
  }
  return { denom };
};

export type ResolvedIBCDenom = ReturnType<typeof normalizeIBCDenom>;
