import { MsgTransfer } from '@manifest-network/manifestjs/dist/codegen/ibc/applications/transfer/v1/tx';

import { createTokenMessage } from '@/components';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { TransferIcon } from '@/components/icons/TransferIcon';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

export const MsgTransferHandler = createSenderReceiverHandler({
  iconSender: TransferIcon,
  successSender: (tx, _, metadata) =>
    createTokenMessage(
      'You sent {0} to {1} via IBC',
      tx.metadata?.token ? [tx.metadata?.token] : [],
      tx.metadata?.receiver,
      'negative',
      metadata
    ),
  failSender: (tx, _, metadata) =>
    createTokenMessage(
      'You failed to send {0} to {1} via IBC',
      tx.metadata?.token ? [tx.metadata?.token] : [],
      tx.metadata?.receiver,
      'negative',
      metadata
    ),
  successReceiver: (tx, _, metadata) =>
    createTokenMessage(
      'You received {0} from {1} via IBC',
      tx.metadata?.token ? [tx.metadata?.token] : [],
      tx.sender,
      'positive',
      metadata
    ),
});

registerHandler(MsgTransfer.typeUrl, MsgTransferHandler);
