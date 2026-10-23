import BigNumber from 'bignumber.js';
import React, { useState } from 'react';

import { HelpIcon } from '@/components';
import { CombinedBalanceInfo } from '@/utils';

export interface MaxButtonProps {
  token: CombinedBalanceInfo | null;
  setTokenAmount: (amount: string) => void;
  disabled?: boolean;
  /**
   * Returns the max amount in base units, or null to leave the amount unchanged.
   * Defaults to the whole balance.
   */
  estimateMax?: (token: CombinedBalanceInfo) => Promise<string | null>;
  /**
   * Whether the network fee is taken out of the max amount.
   */
  feeDeducted?: boolean;
}

export const MaxButton = ({
  token,
  setTokenAmount,
  disabled,
  estimateMax,
  feeDeducted,
}: MaxButtonProps) => {
  const [isEstimating, setIsEstimating] = useState(false);

  return (
    <button
      className="text-xs text-primary cursor-pointer"
      disabled={disabled || isEstimating}
      type="button"
      onClick={async () => {
        if (!token) return;

        setIsEstimating(true);
        try {
          const amount = estimateMax ? await estimateMax(token) : token.amount;
          if (amount === null) return;

          const decimals = token.metadata?.denom_units[1]?.exponent ?? 6;
          const formattedAmount = new BigNumber(amount)
            .div(Math.pow(10, decimals))
            .toFixed(decimals)
            .replace(/\.?0+$/, '');

          setTokenAmount(formattedAmount);
        } finally {
          setIsEstimating(false);
        }
      }}
    >
      MAX
      {token && feeDeducted && (
        <span
          className="tooltip tooltip-primary align-baseline"
          data-tip="Network fee is deducted from the max amount"
        >
          <HelpIcon role="contentinfo" aria-label="info" className="w-3 h-3 ml-1 text-primary" />
        </span>
      )}
    </button>
  );
};
