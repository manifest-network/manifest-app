import { MsgStoreCode } from '@manifest-network/manifestjs/dist/codegen/cosmwasm/wasm/v1/tx';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { AdminsIcon } from '@/components/icons/AdminsIcon';

export const MsgStoreCodeHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: 'You stored WASM code',
  failSender: 'You failed to store WASM code',
  successReceiver: 'N/A',
});

registerHandler(MsgStoreCode.typeUrl, MsgStoreCodeHandler);
