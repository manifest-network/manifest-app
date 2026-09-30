import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import BigNumber from 'bignumber.js';

import env from '@/config/env';
import { shiftDigits } from '@/utils/maths';

import { denomToAsset } from './ibc';

/**
 * Format configuration for large numbers
 * [threshold value, suffix string, maximum fraction digits]
 * Ordered from largest to smallest threshold
 */
const SUFFIXES: [number, string, number][] = [
  [1e24, '_', 0], // Special case. No suffix for >= 1e24, just scientific notation.
  [1e18, 'QT', 2],
  [1e15, 'Q', 2],
  [1e12, 'T', 2],
  [1e9, 'B', 2],
  [1e6, 'M', 2],
  [0, '', 6],
  // Cannot be negative.
];

/**
 * Format a large number to a human-readable string.
 * @param num The number to format.
 */
export function formatLargeNumber(num: number): string {
  if (!Number.isFinite(num)) return 'Invalid number';
  if (num <= 0) return '0';

  if (num >= SUFFIXES[0][0]) {
    return `${num.toExponential(6).replace(/\.?0*e\+?/, 'e')}`;
  }

  for (const [value, suffix, maximumFractionDigits] of SUFFIXES) {
    if (num >= value) {
      let s = (suffix ? num / value : num).toLocaleString(undefined, {
        maximumFractionDigits,
      });

      return `${s}${suffix}`;
    }
  }

  return num.toLocaleString();
}

export function formatDenom(denom: string): string {
  const assetInfo = denomToAsset(env.chain, denom);

  // Fallback to cleaning the denom if no assetInfo
  let cleanDenom = denom.replace(/^factory\/[^/]+\//, '');

  // Skip cleaning for IBC denoms as they should be resolved via assetInfo
  if (cleanDenom.startsWith('ibc/')) {
    cleanDenom = assetInfo?.display.toUpperCase() ?? cleanDenom;
  } else if (cleanDenom.startsWith('u')) {
    cleanDenom = cleanDenom.slice(1).toUpperCase();
  }

  return cleanDenom;
}

/**
 * The unit a token's amounts are shown and entered in. The chain works in base units (umfx,
 * upwr); the UI never does. A display amount is the base amount shifted by `exponent` digits.
 *
 * The display unit is the denom unit named by `metadata.display`, or else the unit with the
 * largest exponent, provided its exponent is above 0. Metadata that declares no unit above the
 * base (the default tokenfactory and IBC give new denoms), or no metadata at all, gets 6
 * decimals, like MFX and PWR. `denom` names the unit found, for labels.
 *
 * Everything that shows, validates or converts a user-facing amount must use this, so the
 * number a user types means the same thing as the number they see.
 */
export function getDisplayUnit(
  metadata?: Pick<MetadataSDKType, 'denom_units' | 'display'> | null
): { denom?: string; exponent: number } {
  const units = metadata?.denom_units ?? [];
  const named = units.find(u => u.denom === metadata?.display);
  const largest = units.reduce<(typeof units)[number] | undefined>(
    (max, u) => (max && (max.exponent ?? 0) >= (u.exponent ?? 0) ? max : u),
    undefined
  );
  const unit = named && (named.exponent ?? 0) > 0 ? named : largest;

  if (unit && (unit.exponent ?? 0) > 0) return { denom: unit.denom, exponent: unit.exponent };
  return { denom: unit?.denom, exponent: 6 };
}

/** The decimal exponent of a token's display unit. See {@link getDisplayUnit}. */
export function getDisplayExponent(
  metadata?: Pick<MetadataSDKType, 'denom_units' | 'display'> | null
): number {
  return getDisplayUnit(metadata).exponent;
}

/**
 * The validation message for an amount with more decimal places than the display `exponent`
 * allows, or undefined if it fits. Converting such an amount to base units would silently round
 * it (`1.5` of a token with exponent 0 would become 2 base units).
 */
export function amountPrecisionError(
  amount: BigNumber.Value,
  exponent: number
): string | undefined {
  if ((new BigNumber(amount).decimalPlaces() ?? 0) <= exponent) return undefined;
  return exponent === 0
    ? 'Amount must be a whole number'
    : `Amount can have at most ${exponent} decimal places`;
}

export function formatAmount(amount: string, denom: string, metadata?: MetadataSDKType[]) {
  const meta = metadata?.find(m => m.base === denom);
  return Number(shiftDigits(amount, -getDisplayExponent(meta)));
}
