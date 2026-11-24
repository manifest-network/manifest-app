import {
  Input,
  MetadataSDKType,
  Output,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { MsgMultiSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';
import BigNumber from 'bignumber.js';
import React from 'react';
import { format } from 'react-string-format';

import { AMOUNT_TONE_CLASS, AmountTone } from '@/components/bank/handlers/amountTone';
import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { BankIcon } from '@/components/icons/BankIcon';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import { formatAmount, formatDenom, formatLargeNumber } from '@/utils';

const createSendMessage = (
  template: string,
  inputs: Input[],
  numReceiver: number,
  tone: AmountTone,
  metadata?: MetadataSDKType[]
) => {
  let allAmountDenom: string[] = [];
  // The CosmosSDK specified that only one input is allowed for MsgMultiSend
  inputs?.[0]?.coins.forEach(coin => {
    const amount = coin.amount;
    const denom = coin.denom;
    const formattedAmount = formatLargeNumber(formatAmount(amount, denom, metadata));
    const formattedDenom = formatDenom(denom);
    const amountDenom = formattedAmount + ' ' + formattedDenom;
    allAmountDenom.push(amountDenom);
  });

  let displayAmountDenom: string;
  if (allAmountDenom.length > 2) {
    displayAmountDenom = `${allAmountDenom[0]}, ${allAmountDenom[allAmountDenom.length - 1]} and ${allAmountDenom.length - 2} more denomination(s)`;
  } else {
    displayAmountDenom = allAmountDenom.join(', ');
  }

  const coloredAmountDenom = <span className={AMOUNT_TONE_CLASS[tone]}>{displayAmountDenom}</span>;
  const message = format(template, coloredAmountDenom, numReceiver);
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

const createReceiveMessage = (
  template: string,
  outputs: Output[],
  address: string,
  tone: AmountTone,
  sender: string,
  metadata?: MetadataSDKType[]
) => {
  const myOutputs = new Map<string, BigNumber>();
  try {
    outputs.forEach(output => {
      if (output.address === address) {
        // Compute the total amount of each denom received
        output.coins.forEach(coin => {
          myOutputs.set(
            coin.denom,
            BigNumber.sum(myOutputs.get(coin.denom) ?? 0, new BigNumber(coin.amount))
          );
        });
      }
    });
  } catch (e) {
    console.error('Error computing received amounts', e);
  }

  let allAmountDenom: string[] = [];
  myOutputs.forEach((amount, denom) => {
    const formattedAmount = formatLargeNumber(formatAmount(amount.toFixed(), denom, metadata));
    const formattedDenom = formatDenom(denom);
    const amountDenom = formattedAmount + ' ' + formattedDenom;
    allAmountDenom.push(amountDenom);
  });

  let displayAmountDenom: string;
  if (allAmountDenom.length > 2) {
    displayAmountDenom = `${allAmountDenom[0]}, ${allAmountDenom[allAmountDenom.length - 1]} and ${allAmountDenom.length - 2} more denomination(s)`;
  } else {
    displayAmountDenom = allAmountDenom.join(', ');
  }

  const coloredAmountDenom = <span className={AMOUNT_TONE_CLASS[tone]}>{displayAmountDenom}</span>;
  const message = format(
    template,
    coloredAmountDenom,
    <TruncatedAddressWithCopy address={sender} />
  );
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgMultiSendHandler = createSenderReceiverHandler({
  iconSender: BankIcon,
  successSender: (tx, _, metadata) => {
    return createSendMessage(
      'You sent {0} equally divided between {1} addresses',
      tx.metadata?.inputs,
      tx.metadata?.outputs?.length,
      'negative',
      metadata
    );
  },
  failSender: (tx, _, metadata) => {
    return createSendMessage(
      'You failed to send {0} equally divided between {1} addresses',
      tx.metadata?.inputs,
      tx.metadata?.outputs?.length,
      'negative',
      metadata
    );
  },
  successReceiver: (tx, address, metadata) => {
    return createReceiveMessage(
      'You received {0} from {1}',
      tx.metadata?.outputs,
      address,
      'positive',
      tx.sender,
      metadata
    );
  },
});

registerHandler(MsgMultiSend.typeUrl, MsgMultiSendHandler);
