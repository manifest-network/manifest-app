import { MsgGrant } from '@manifest-network/manifestjs/dist/codegen/cosmos/authz/v1beta1/tx';
import { format } from 'react-string-format';

import { AdminsIcon, TruncatedAddressWithCopy } from '@/components';

import { createSenderReceiverHandler } from '../createSenderReceiverHandler';
import { registerHandler } from '../handlerRegistry';

const createMessage = (template: string, addr: string, msg: string) => {
  const message = format(
    template,
    addr ? <TruncatedAddressWithCopy address={addr} /> : 'unknown',
    <span className="text-yellow-500">{msg}</span>
  );
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgGrantHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: tx =>
    createMessage(
      'You granted {0} permission to execute {1} on your behalf',
      tx.metadata?.grantee,
      tx.metadata?.grant?.authorization?.msg
    ),
  failSender: tx =>
    createMessage(
      'You failed to grant {0} permission to execute {1} on your behalf',
      tx.metadata?.grantee,
      tx.metadata?.grant?.authorization?.msg
    ),
  successReceiver: tx =>
    createMessage(
      'You were granted permission to execute {1} on behalf of {0}',
      tx.metadata?.granter,
      tx.metadata?.grant?.authorization?.msg
    ),
});

registerHandler(MsgGrant.typeUrl, MsgGrantHandler);
