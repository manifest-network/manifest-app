import { MsgBurnHeldBalance } from '@manifest-network/manifestjs/dist/codegen/liftedinit/manifest/v1/tx';

import { createTokenMessage } from '@/components';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { BurnIcon } from '@/components/icons/BurnIcon';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

export const MsgBurnHeldBalanceHandler = createSenderReceiverHandler({
  iconSender: BurnIcon,
  successSender: (tx, _, metadata) =>
    createTokenMessage(
      'You burned {0} from {1}',
      tx.metadata?.burnCoins,
      tx.sender,
      'negative',
      metadata
    ),
  failSender: 'You failed to burn tokens',
  successReceiver: (tx, _, metadata) =>
    createTokenMessage(
      'You were burned {0} by {1}',
      tx.metadata?.burnCoins,
      tx.sender,
      'negative',
      metadata
    ),
});

registerHandler(MsgBurnHeldBalance.typeUrl, MsgBurnHeldBalanceHandler);
