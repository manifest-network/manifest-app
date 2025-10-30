import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { MsgExecuteContract } from '@manifest-network/manifestjs/dist/codegen/cosmwasm/wasm/v1/tx';
import React from 'react';
import { MdOutlineSmartToy } from 'react-icons/md';
import { format } from 'react-string-format';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import env from '@/config/env';
import { formatAmount, formatDenomWithBadge, formatLargeNumber } from '@/utils';

import { TxMessage } from '../../types';

export const MsgExecuteContractHandler = createSenderReceiverHandler({
  iconSender: () => <MdOutlineSmartToy className="w-6 h-6" />,
  successSender: (tx, _, metadata) => buildContractMessage(true, tx, metadata),
  failSender: (tx, _, metadata) => buildContractMessage(false, tx, metadata),
  successReceiver: 'A contract was executed',
});

registerHandler(MsgExecuteContract.typeUrl, MsgExecuteContractHandler);

function formatFunds(funds: any, metadata?: MetadataSDKType[]) {
  const formattedAmount = formatLargeNumber(formatAmount(funds?.amount, funds?.denom, metadata));
  const formattedDenom = formatDenomWithBadge(funds?.denom);
  return { formattedAmount, formattedDenom };
}

function buildContractMessage(success: boolean, tx: TxMessage, metadata?: MetadataSDKType[]) {
  const unknown = success ? 'Unknown contract executed' : 'Unknown contract execution failed';

  switch (tx.metadata?.contract) {
    case env.mfxToPwrConversionContractAddress: {
      const funds = tx.metadata?.funds?.[0];
      const { formattedAmount, formattedDenom } = formatFunds(funds, metadata);
      const formattedTargetDenom = formatDenomWithBadge(env.pwrTokenDenom);
      const color = success ? 'text-green-500' : 'text-red-500';
      const template = success ? 'You converted {0} to {1}' : 'You failed to convert {0} to {1}';

      return format(
        template,
        <span className={color}>
          {formattedAmount} {formattedDenom}
        </span>,
        <span>{formattedTargetDenom}</span>
      );
    }
    default:
      return unknown;
  }
}
