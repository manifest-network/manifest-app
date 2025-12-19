import { MsgRevoke } from '@manifest-network/manifestjs/dist/codegen/cosmos/authz/v1beta1/tx';
import { format } from 'react-string-format';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { AdminsIcon } from '@/components/icons/AdminsIcon';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';

const createMessage = (template: string, addr: string, msg: string) => {
  const message = format(
    template,
    addr ? <TruncatedAddressWithCopy address={addr} /> : 'unknown',
    <span className="text-yellow-500">{msg}</span>
  );
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgRevokeHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: tx =>
    createMessage(
      'You revoked {0} permission to execute {1} on your behalf',
      tx.metadata?.grantee,
      tx.metadata?.msgTypeUrl
    ),
  failSender: tx =>
    createMessage(
      'You failed to revoke {0} permission to execute {1} on your behalf',
      tx.metadata?.grantee,
      tx.metadata?.msgTypeUrl
    ),
  successReceiver: tx =>
    createMessage(
      'You were revoked permission to execute {1} on behalf of {0}',
      tx.metadata?.granter,
      tx.metadata?.msgTypeUrl
    ),
});

registerHandler(MsgRevoke.typeUrl, MsgRevokeHandler);
