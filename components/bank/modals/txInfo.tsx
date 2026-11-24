import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

import { TxMessage } from '@/components/bank/types';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import env from '@/config/env';

interface TxInfoModalProps {
  tx: TxMessage;
  modalId: string;
}

export default function TxInfoModal({ tx, modalId }: TxInfoModalProps) {
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  return (
    <dialog aria-label="tx_info_modal" id={modalId} className={`modal z-999`}>
      <div
        className="modal-box max-w-4xl mx-auto rounded-3xl bg-surface-panel shadow-lg relative z-1000"
        aria-label="tx info"
      >
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-content-muted hover:bg-surface-hover">
            ✕
          </button>
        </form>
        <h3 className="text-xl font-semibold text-base-content mb-6">Transaction Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InfoItem label="TRANSACTION HASH" value={tx?.id} isAddress={true} />
            <InfoItem label="BLOCK" value={tx?.height?.toString()} />
          </div>
          <div>
            <InfoItem label="SENDER" value={tx?.sender} isAddress={true} />
            <InfoItem label="TIMESTAMP" value={formatDate(tx?.timestamp)} />
          </div>
        </div>
        {tx.memo && (
          <div>
            <InfoItem label="MEMO" value={tx.memo} />
          </div>
        )}
        {tx.error && (
          <div>
            <InfoItem label="ERROR" value={isBase64(tx.error) ? atob(tx.error) : tx.error} />
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button></button>
      </form>
    </dialog>
  );
}
function InfoItem({
  label,
  value,
  isAddress = false,
}: Readonly<{
  label: string;
  value: string;
  isAddress?: boolean;
}>) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-content-muted mb-2">{label}</p>
      <div className="bg-surface-inset rounded-2xl p-4">
        {isAddress ? (
          <div className="flex items-center">
            <TruncatedAddressWithCopy address={value} />
            <a
              href={`${env.explorerUrl}/${label === 'TRANSACTION HASH' ? 'transaction' : 'account'}/${label?.includes('TRANSACTION') ? value?.toUpperCase() : value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary hover:text-primary/50"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        ) : (
          <p className="text-base-content">
            {label.includes('TRANSACTION') ? value.toUpperCase() : value}
          </p>
        )}
      </div>
    </div>
  );
}
