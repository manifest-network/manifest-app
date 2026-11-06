import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import React from 'react';

import { QuestionIcon } from '@/components/icons/QuestionIcon';

import { TxMessage } from '../types';

export function createSenderReceiverHandler({
  iconSender,
  iconReceiver,
  successSender,
  failSender,
  successReceiver,
  failReceiver,
}: {
  iconSender: React.ComponentType;
  iconReceiver?: React.ComponentType;
  successSender:
    string | ((tx: TxMessage, address: string, metadata?: MetadataSDKType[]) => React.ReactNode);
  failSender:
    string | ((tx: TxMessage, address: string, metadata?: MetadataSDKType[]) => React.ReactNode);
  successReceiver:
    string | ((tx: TxMessage, address: string, metadata?: MetadataSDKType[]) => React.ReactNode);
  failReceiver?: string | ((tx: TxMessage, address: string) => React.ReactNode);
}) {
  return (tx: TxMessage, address: string, metadata?: MetadataSDKType[]) => {
    const isSender = tx.sender === address;
    const hasError = !!tx.error;

    iconSender = iconSender ?? QuestionIcon;
    iconReceiver = iconReceiver ?? iconSender ?? QuestionIcon;

    const resolveMessage = (
      msg:
        | React.ReactNode
        | ((tx: TxMessage, address: string, metadata?: MetadataSDKType[]) => React.ReactNode)
    ) => (typeof msg === 'function' ? msg(tx, address, metadata) : msg);

    const successSenderMsg = resolveMessage(successSender);
    const failSenderMsg = resolveMessage(failSender);
    const successReceiverMsg = resolveMessage(successReceiver);
    const failReceiverMsg = resolveMessage(failReceiver ?? 'Anomaly detected');

    return {
      icon: isSender ? iconSender : iconReceiver,
      message: hasError
        ? isSender
          ? failSenderMsg
          : failReceiverMsg
        : isSender
          ? successSenderMsg
          : successReceiverMsg,
    };
  };
}
