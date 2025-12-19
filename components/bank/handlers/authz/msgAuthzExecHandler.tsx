import { MsgExec } from '@manifest-network/manifestjs/dist/codegen/cosmos/authz/v1beta1/tx';
import { format } from 'react-string-format';

import { createSenderReceiverHandler } from '@/components/bank/handlers/createSenderReceiverHandler';
import { registerHandler } from '@/components/bank/handlers/handlerRegistry';
import { AdminsIcon } from '@/components/icons/AdminsIcon';

interface CosmosMessage {
  '@type'?: string;
}

const getUniqueTypeUrls = (msgs: CosmosMessage[] | undefined): string[] => {
  if (!msgs) return [];
  const typeUrls = new Set(
    msgs.map(msg => msg['@type']).filter((type): type is string => type !== undefined)
  );
  return Array.from(typeUrls);
};

const createMessage = (
  singleTypeTemplate: string,
  multiTypeTemplate: string,
  msgs: CosmosMessage[] | undefined
) => {
  const len = msgs?.length ?? 'some';
  const uniqueTypeUrls = getUniqueTypeUrls(msgs);

  if (uniqueTypeUrls.length === 1 && uniqueTypeUrls[0]) {
    const typeUrl = uniqueTypeUrls[0];
    const message = format(
      singleTypeTemplate,
      <span className="text-yellow-500">{len}</span>,
      <span className="text-yellow-500">{typeUrl}</span>
    );
    return <span className="flex flex-wrap gap-1">{message}</span>;
  }

  const message = format(multiTypeTemplate, <span className="text-yellow-500">{len}</span>);
  return <span className="flex flex-wrap gap-1">{message}</span>;
};

export const MsgAuthzExecHandler = createSenderReceiverHandler({
  iconSender: AdminsIcon,
  successSender: tx =>
    createMessage(
      'You executed {0} message(s) of type {1} on behalf of another account',
      'You executed {0} message(s) on behalf of another account',
      tx.metadata?.msgs
    ),
  failSender: tx =>
    createMessage(
      'You failed to execute {0} message(s) of type {1} on behalf of another account',
      'You failed to execute {0} message(s) on behalf of another account',
      tx.metadata?.msgs
    ),
  successReceiver: tx =>
    createMessage(
      '{0} message(s) of type {1} were executed on your behalf',
      '{0} message(s) were executed on your behalf',
      tx.metadata?.msgs
    ),
});

registerHandler(MsgExec.typeUrl, MsgAuthzExecHandler);
