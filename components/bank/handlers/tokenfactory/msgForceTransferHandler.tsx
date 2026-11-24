import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { MsgForceTransfer } from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';
import React from 'react';
import { format } from 'react-string-format';

import { AMOUNT_TONE_CLASS, AmountTone } from '@/components/bank/handlers/amountTone';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { FactoryIcon } from '@/components/icons/FactoryIcon';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import { formatAmount, formatDenom, formatLargeNumber } from '@/utils';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

const createMessage = (
  template: string,
  amount: string,
  denom: string,
  from: string,
  to: string,
  tone: AmountTone,
  metadata?: MetadataSDKType[],
  sender?: string
) => {
  const formattedAmount = formatLargeNumber(formatAmount(amount, denom, metadata));
  const formattedDenom = formatDenom(denom);
  // coloredAmount is {0}
  const coloredAmount = (
    <span className={AMOUNT_TONE_CLASS[tone]}>
      {formattedAmount} {formattedDenom}
    </span>
  );
  const message = format(
    template,
    coloredAmount,
    from ? <TruncatedAddressWithCopy address={from} /> : 'an unknown address',
    to ? <TruncatedAddressWithCopy address={to} /> : 'an unknown address',
    sender ? <TruncatedAddressWithCopy address={sender} /> : 'an unknown address'
  );
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgForceTransferHandler = createSenderReceiverHandler({
  iconSender: FactoryIcon,
  successSender: (tx, _, metadata) =>
    createMessage(
      'You forced the transfer of {0} from {1} to {2}',
      tx.metadata?.amount?.amount,
      tx.metadata?.amount?.denom,
      tx.metadata?.transferFromAddress,
      tx.metadata?.transferToAddress,
      'neutral',
      metadata
    ),
  failSender: (tx, _, metadata) =>
    createMessage(
      'You failed to force the transfer of {0} from {1} to {2}',
      tx.metadata?.amount?.amount,
      tx.metadata?.amount?.denom,
      tx.metadata?.transferFromAddress,
      tx.metadata?.transferToAddress,
      'neutral',
      metadata
    ),
  successReceiver: (tx, _, metadata) =>
    createMessage(
      '{0} was force transferred from {1} to {2} by {3}',
      tx.metadata?.amount?.amount,
      tx.metadata?.amount?.denom,
      tx.metadata?.transferFromAddress,
      tx.metadata?.transferToAddress,
      'neutral',
      metadata,
      tx.sender
    ),
});

registerHandler(MsgForceTransfer.typeUrl, MsgForceTransferHandler);
