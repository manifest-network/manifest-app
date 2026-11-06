import BigNumber from 'bignumber.js';
import React from 'react';

import { DenomDisplay } from '@/components';
import { CombinedBalanceInfo, formatLargeNumber, getDisplayUnit, shiftDigits } from '@/utils';

/**
 * Props for the TokenBalance component.
 * @param token The token balance information. This should include amount and denomination,
 *              as well as metadata if available. If amount is missing, it is assumed to be 0.
 * @param denom The denomination to display. If not provided, the token's display name is used.
 */
export interface TokenBalanceProps {
  token: Partial<CombinedBalanceInfo>;
  denom?: string | null;
}

/**
 * Display the token balance, handling very large amounts of tokens.
 * @constructor
 */
export const TokenBalance = ({ token, denom }: TokenBalanceProps) => {
  const { denom: unitDenom, exponent } = getDisplayUnit(token.metadata);
  denom = (denom ?? unitDenom ?? token.display ?? '<unknown>').toUpperCase();

  const [balance, tooltipAmount] = React.useMemo(() => {
    const amount = shiftDigits(token.amount ?? 0, -exponent);
    const amountBN = new BigNumber(amount);
    const balance = formatLargeNumber(Number(amount));

    const int = BigInt(amountBN.integerValue(BigNumber.ROUND_DOWN).toFixed(0));
    const dec = amountBN.minus(int.toString()).toNumber();
    const tooltipAmount = `${int.toLocaleString()}${dec ? ('' + dec).replace(/^0\./, '.') : ''}`;

    return [balance, tooltipAmount];
  }, [token.amount, exponent]);

  // Only show tooltip if the balance is not the same as the tooltip amount.
  const tooltip = balance !== tooltipAmount && `${tooltipAmount} ${denom}`;
  return (
    <span className={`inline-block ${tooltip ? 'tooltip' : ''} token-amount`} data-tip={tooltip}>
      {balance} <DenomDisplay image={false} denom={denom} />
    </span>
  );
};
