import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';

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
 * The unit a token's amounts are shown and entered in: the denom unit named by
 * `metadata.display`, or the unit with the largest exponent if none is. A display amount is
 * the base amount shifted by `exponent` digits.
 *
 * Without metadata (or denom units), assume 6 decimals.
 *
 * Everything that shows, validates or converts a user-facing amount must use this, so the
 * number a user types means the same thing as the number they see.
 */
export function getDisplayUnit(
  metadata?: Pick<MetadataSDKType, 'denom_units' | 'display'> | null
): { denom?: string; exponent: number } {
  const units = metadata?.denom_units ?? [];
  if (units.length === 0) return { exponent: 6 };

  const unit =
    units.find(u => u.denom === metadata?.display) ??
    units.reduce((max, u) => ((u.exponent ?? 0) > (max.exponent ?? 0) ? u : max));
  return { denom: unit.denom, exponent: unit.exponent ?? 0 };
}

/** The decimal exponent of a token's display unit. See {@link getDisplayUnit}. */
export function getDisplayExponent(
  metadata?: Pick<MetadataSDKType, 'denom_units' | 'display'> | null
): number {
  return getDisplayUnit(metadata).exponent;
}

export function formatAmount(amount: string, denom: string, metadata?: MetadataSDKType[]) {
  const meta = metadata?.find(m => m.base === denom);
  return Number(shiftDigits(amount, -getDisplayExponent(meta)));
}
