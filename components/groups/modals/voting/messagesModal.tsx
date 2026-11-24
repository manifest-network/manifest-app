import { Dialog } from '@headlessui/react';
import { ProposalSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import React from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';

import { useTheme } from '@/contexts';

SyntaxHighlighter.registerLanguage('json', json);

export function MessagesModal({
  proposal,
  opened,
  onClose,
}: {
  proposal: ProposalSDKType | undefined;
  opened: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();

  if (!proposal) return null;

  return (
    <Dialog
      open={opened}
      onClose={onClose}
      className="modal modal-open fixed flex p-0 m-0 top-0 right-0 z-9999"
    >
      <div className="fixed inset-0 bg-black/30 " aria-hidden="true" />

      <Dialog.Panel
        className="modal-box max-w-4xl m-auto bg-secondary"
        aria-label="proposal-messages-dialog"
      >
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Proposal Messages</h3>
        <div className="overflow-y-auto max-h-[60vh]">
          <SyntaxHighlighter
            language="json"
            style={theme === 'dark' ? oneDark : oneLight}
            customStyle={{
              backgroundColor: 'transparent',
              padding: '1rem',
              borderRadius: 'var(--radius-box)',
            }}
          >
            {(() => {
              try {
                return JSON.stringify(
                  proposal.messages,
                  (_, v) => (typeof v === 'bigint' ? v.toString() : v),
                  2
                );
              } catch (error) {
                console.error('Failed to stringify messages:', error);
                return 'Error: Unable to display messages';
              }
            })()}
          </SyntaxHighlighter>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
