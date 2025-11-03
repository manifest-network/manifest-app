import { MsgInstantiateContract } from '@manifest-network/manifestjs/dist/codegen/cosmwasm/wasm/v1/tx';
import { format } from 'react-string-format';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { AdminsIcon } from '@/components/icons/AdminsIcon';

const createMessage = (template: string, code: string) => {
  const message = format(template, code);
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgInstantiateContractHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: tx =>
    createMessage('You instantiated contract with code ID #{0}', tx.metadata?.codeId),
  failSender: tx =>
    createMessage('You failed to instantiate contract with code ID #{0}', tx.metadata?.codeId),
  successReceiver: 'N/A',
});

registerHandler(MsgInstantiateContract.typeUrl, MsgInstantiateContractHandler);
