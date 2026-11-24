import { MsgSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';

import { createTokenMessage } from '@/components';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { BankIcon } from '@/components/icons/BankIcon';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

export const MsgSendHandler = createSenderReceiverHandler({
  iconSender: BankIcon,
  successSender: (tx, _, metadata) => {
    return createTokenMessage(
      'You sent {0} to {1}',
      tx.metadata?.amount,
      tx.metadata?.toAddress,
      'negative',
      metadata
    );
  },
  failSender: (tx, _, metadata) => {
    return createTokenMessage(
      'You failed to send {0} to {1}',
      tx.metadata?.amount,
      tx.metadata?.toAddress,
      'negative',
      metadata
    );
  },
  successReceiver: (tx, _, metadata) => {
    return createTokenMessage(
      'You received {0} from {1}',
      tx.metadata?.amount,
      tx.sender,
      'positive',
      metadata
    );
  },
});

registerHandler(MsgSend.typeUrl, MsgSendHandler);
