import { MsgCommunityPoolSpend } from '@manifest-network/manifestjs/dist/codegen/cosmos/distribution/v1beta1/tx';

import { createTokenMessage } from '@/components';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { BankIcon } from '@/components/icons/BankIcon';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

export const MsgCommunityPoolSpendHandler = createSenderReceiverHandler({
  iconSender: BankIcon,
  successSender: (tx, _, metadata) => {
    return createTokenMessage(
      'You sent {0} from the community pool to {1}',
      tx.metadata?.amount,
      tx.metadata?.recipient,
      'yellow',
      metadata
    );
  },
  failSender: (tx, _, metadata) => {
    return createTokenMessage(
      'You failed to send {0} from the community pool to {1}',
      tx.metadata?.amount,
      tx.metadata?.recipient,
      'red',
      metadata
    );
  },
  successReceiver: (tx, _, metadata) => {
    return createTokenMessage(
      'You received {0} from the community pool',
      tx.metadata?.amount,
      tx.sender,
      'green',
      metadata
    );
  },
});

registerHandler(MsgCommunityPoolSpend.typeUrl, MsgCommunityPoolSpendHandler);
