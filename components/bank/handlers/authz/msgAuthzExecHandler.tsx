import { MsgExec } from '@manifest-network/manifestjs/dist/codegen/cosmos/authz/v1beta1/tx';
import { format } from 'react-string-format';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { AdminsIcon } from '@/components/icons/AdminsIcon';

const createMessage = (template: string, len: number) => {
  const l = len ?? 'some';
  const message = format(template, <span className="text-yellow-500">{l}</span>);
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgAuthzExecHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: tx =>
    createMessage(
      'You executed {0} message(s) on behalf of another account',
      tx.metadata?.msgs?.length
    ),
  failSender: tx =>
    createMessage(
      'You failed to execute {0} message(s) on behalf of another account',
      tx.metadata?.msgs?.length
    ),
  successReceiver: tx =>
    createMessage('{0} message(s) were executed on your behalf', tx.metadata?.msgs?.length),
});

registerHandler(MsgExec.typeUrl, MsgAuthzExecHandler);
