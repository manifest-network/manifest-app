import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import React, { useState } from 'react';

import { TimeAgo } from '@/components';
import { getHandler } from '@/components/bank/handlers/handlerRegistry';
import { Navigator, Pagination } from '@/components/react/Pagination';
import { useTokenFactoryDenomsMetadata } from '@/hooks';
import { formatDenomWithBadge, formatLargeNumber, shiftDigits } from '@/utils';

import TxInfoModal from '../modals/txInfo';
import { TransactionAmount, TxMessage } from '../types';

export interface TransactionGroup {
  tx_hash: string;
  block_number: number;
  formatted_date: string;
  fee?: TransactionAmount;
  memo?: string;
}

export function HistoryBox({
  isLoading: initialLoading,
  address,
  currentPage,
  setCurrentPage,
  sendTxs,
  totalPages,
  txLoading,
  isError,
  skeletonGroupCount,
  skeletonTxCount,
}: Readonly<{
  isLoading: boolean;
  address: string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sendTxs: TxMessage[];
  totalPages: number;
  txLoading: boolean;
  isError: boolean;
  skeletonGroupCount: number;
  skeletonTxCount: number;
}>) {
  const [selectedTx, setSelectedTx] = useState<TxMessage | null>(null);
  const { metadatas, isMetadatasLoading } = useTokenFactoryDenomsMetadata();

  const isLoading = initialLoading || txLoading || isMetadatasLoading;

  function formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getTransactionIcon(tx: TxMessage, address: string) {
    const handler = getHandler(tx.type);
    const { icon: IconComponent } = handler(tx, address);
    return <IconComponent />;
  }

  function getTransactionMessage(tx: TxMessage, address: string, metadata?: MetadataSDKType[]) {
    const handler = getHandler(tx.type);
    return handler(tx, address, metadata).message;
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden h-full" data-testid="historyBox">
        <div aria-label="skeleton" className="space-y-2">
          {[...Array(skeletonGroupCount)].map((_, groupIndex) => (
            <div key={groupIndex}>
              <div className="space-y-2">
                {[...Array(skeletonTxCount)].map((_, txIndex) => (
                  <div
                    key={txIndex}
                    className="flex items-center justify-between p-4 bg-surface-card rounded-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="skeleton w-9 h-9 rounded-full"></div>
                      <div className="skeleton w-11 h-11 rounded-md"></div>
                      <div>
                        <div className="flex flex-row items-center gap-2">
                          <div className="skeleton h-6 w-16"></div>
                          <div className="skeleton h-6 w-12"></div>
                        </div>
                        <div className="skeleton h-5 w-32 mt-1"></div>
                      </div>
                    </div>
                    <div className="skeleton h-4 w-24 hidden sm:block"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="historyBox"
        className="flex items-center justify-center h-[200px] w-full bg-surface-card rounded-2xl"
      >
        <p className="text-center text-error">Error loading transactions</p>
      </div>
    );
  }

  if (!sendTxs || sendTxs.length === 0) {
    return (
      <div
        data-testid="historyBox"
        className="flex items-center justify-center h-[200px] w-full bg-surface-card mt-5 rounded-2xl"
      >
        <p className="text-center text-content-muted">No transactions found!</p>
      </div>
    );
  }

  return (
    <div data-testid="historyBox">
      <div className="h-full w-full space-y-2">
        {sendTxs?.slice(0, skeletonTxCount).map((tx, index) => (
          <div
            key={`${tx.id}-${index}`}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 
                    ${
                      tx.error
                        ? 'bg-error/15 hover:bg-error/30'
                        : 'bg-surface-card hover:bg-surface-card-hover'
                    }
                    rounded-2xl cursor-pointer transition-colors`}
            onClick={() => {
              setSelectedTx(tx);
              (document?.getElementById('tx_modal_info') as HTMLDialogElement)?.showModal();
            }}
          >
            <div className="flex flex-row items-center space-x-3 mb-2 sm:mb-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base-content">
                {getTransactionIcon(tx, address)}
              </div>
              <div>
                <TimeAgo datetime={tx.timestamp} className="text-sm text-content-muted" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                  <span className="font-semibold text-base-content">
                    {getTransactionMessage(tx, address, metadatas?.metadatas)}
                  </span>
                </div>
                {tx.message_index < 10000 ? (
                  tx.sender === address ? (
                    <div className="text-content-muted text-xs mt-1">
                      Incl.:{' '}
                      {tx.fee && (
                        <>
                          {formatLargeNumber(Number(shiftDigits(tx.fee.amount?.[0]?.amount, -6)))}{' '}
                          {formatDenomWithBadge(tx.fee.amount?.[0]?.denom, true)} fee
                        </>
                      )}
                    </div>
                  ) : null
                ) : (
                  <div className="text-content-muted text-xs mt-1">
                    Fee incl. in proposal #{tx.proposal_ids} execution
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Navigator
        nbPages={totalPages}
        page={currentPage - 1}
        onChange={p => setCurrentPage(p + 1)}
      />

      <TxInfoModal modalId="tx_modal_info" tx={selectedTx ?? ({} as TxMessage)} />
    </div>
  );
}
