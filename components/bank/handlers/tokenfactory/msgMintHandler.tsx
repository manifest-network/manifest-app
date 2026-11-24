import { MsgMint } from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';

import { createTokenMessage } from '@/components';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { FactoryIcon } from '@/components/icons/FactoryIcon';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import { formatAmount, formatDenom, formatLargeNumber } from '@/utils';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';

export const MsgMintHandler = createSenderReceiverHandler({
  iconSender: FactoryIcon,
  successSender: (tx, _, metadata) =>
    createTokenMessage(
      'You minted {0} to {1}',
      [tx.metadata?.amount],
      tx.metadata?.mintToAddress,
      'positive',
      metadata
    ),
  failSender: (tx, _, metadata) =>
    createTokenMessage(
      'You failed to mint {0} to {1}',
      [tx.metadata?.amount],
      tx.metadata?.mintToAddress,
      'negative',
      metadata
    ),
  successReceiver: (tx, _, metadata) =>
    createTokenMessage(
      'You were minted {0} from {1}',
      [tx.metadata?.amount],
      tx.sender,
      'positive',
      metadata
    ),
});

registerHandler(MsgMint.typeUrl, MsgMintHandler);
