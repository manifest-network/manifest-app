import React, { useContext, useMemo, useState } from 'react';
import { PiSwap } from 'react-icons/pi';

import { Pagination, SearchContext, SearchFilter, TokenBalance } from '@/components';
import ConvertModal from '@/components/bank/modals/convertModal';
import SendModal from '@/components/bank/modals/sendModal';
import { DenomDisplay, DenomInfoModal } from '@/components/factory';
import { QuestionIcon, SendTxIcon } from '@/components/icons';
import { isMfxToken, truncateString } from '@/utils';
import { CombinedBalanceInfo } from '@/utils/types';

interface TokenListProps {
  balances: CombinedBalanceInfo[] | undefined;
  isLoading: boolean;
  address: string;
  pageSize: number;
  isGroup?: boolean;
  admin?: string;
}

// Separate component to use useContext hook
const TokenListContent = ({
  balances,
  pageSize,
  isLoading,
  address,
  isGroup,
  admin,
}: Readonly<TokenListProps>) => {
  const [selectedDenomBase, setSelectedDenomBase] = useState<any>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [openDenomInfoModal, setOpenDenomInfoModal] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const { term } = useContext(SearchContext);

  // Memoize filtered balances to prevent unnecessary pagination resets
  const filteredBalances = useMemo(() => {
    if (!balances) return [];
    return balances.filter(balance =>
      balance.metadata?.display.toLowerCase().includes(term.toLowerCase())
    );
  }, [balances, term]);

  if (filteredBalances.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] w-full bg-[#FFFFFFCC] dark:bg-[#FFFFFF0F] rounded-[16px]">
        <p className="text-center text-[#00000099] dark:text-[#FFFFFF99]">No tokens found!</p>
      </div>
    );
  }

  return (
    <>
      <Pagination pageSize={pageSize} dataset={filteredBalances} className="space-y-2">
        {data =>
          data.map(balance => (
            <div
              key={balance.base}
              aria-label={balance.base}
              className="flex flex-row justify-between gap-4 items-center p-4 bg-[#FFFFFFCC] dark:bg-[#FFFFFF0F] rounded-[16px] cursor-pointer hover:bg-[#FFFFFF66] dark:hover:bg-[#FFFFFF1A] transition-colors"
              onClick={() => {
                setSelectedDenomBase(balance?.base);
                setOpenDenomInfoModal(true);
              }}
            >
              <div className="flex flex-row gap-4 items-center justify-start">
                <DenomDisplay metadata={balance.metadata} />
              </div>
              <div className="text-center hidden sm:block md:block lg:block xl:block">
                <TokenBalance
                  token={balance}
                  denom={balance.metadata && truncateString(balance.metadata?.display, 12)}
                />
              </div>
              <div className="flex flex-row gap-2">
                <div
                  className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
                  data-tip="Token Details"
                >
                  <button
                    aria-label={`info-${balance?.display}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedDenomBase(balance?.base);
                      setOpenDenomInfoModal(true);
                    }}
                    className="btn btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline hover:outline-primary hover:outline-1 outline-hidden"
                  >
                    <QuestionIcon className="w-7 h-7 text-current" />
                  </button>
                </div>

                {isMfxToken(balance?.base) && (
                  <div
                    className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
                    data-tip="Convert MFX to PWR"
                  >
                    <button
                      aria-label="convert-mfx"
                      data-testid="convert-mfx-button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedDenomBase(balance?.base);
                        setIsConvertModalOpen(true);
                      }}
                      className="btn btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline hover:outline-primary hover:outline-1 outline-hidden"
                    >
                      <PiSwap className="w-7 h-7 text-current" />
                    </button>
                  </div>
                )}

                <div
                  className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
                  data-tip="Send Tokens"
                >
                  <button
                    aria-label={`send-${balance?.display}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedDenomBase(balance?.base);
                      setIsSendModalOpen(true);
                    }}
                    className="btn btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline hover:outline-primary hover:outline-1 outline-hidden"
                  >
                    <SendTxIcon className="w-7 h-7 text-current" />
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </Pagination>

      {/* Modals */}
      <DenomInfoModal
        denom={balances?.find(b => b.base === selectedDenomBase)?.metadata ?? null}
        balance={balances?.find(b => b.base === selectedDenomBase)?.amount ?? null}
        open={openDenomInfoModal}
        onClose={() => setOpenDenomInfoModal(false)}
      />

      <SendModal
        address={address}
        balances={balances ?? ([] as CombinedBalanceInfo[])}
        isBalancesLoading={isLoading}
        selectedDenom={selectedDenomBase}
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        isGroup={isGroup}
        admin={admin}
      />

      <ConvertModal
        address={address}
        balances={balances?.find(b => isMfxToken(b.base))}
        isBalancesLoading={isLoading}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        isGroup={isGroup}
        admin={admin}
      />
    </>
  );
};

export const TokenList = ({
  balances,
  isLoading,
  address,
  pageSize,
  isGroup,
  admin,
}: Readonly<TokenListProps>) => {
  const skeletonItems = useMemo(
    () =>
      [...Array(pageSize)].map((_, i) => (
        <div
          key={i}
          className="flex flex-row justify-between gap-4 items-center p-4 bg-[#FFFFFFCC] dark:bg-[#FFFFFF0F] rounded-[16px]"
        >
          <div className="flex flex-row gap-4 items-center justify-start">
            <div className="skeleton w-11 h-11 rounded-md" />
            <div className="space-y-1">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-3 w-14" />
            </div>
          </div>
          <div className="text-center hidden sm:block md:block lg:hidden xl:block">
            <div className="skeleton h-4 w-28" />
          </div>
          <div className="flex flex-row gap-2">
            <div className="skeleton w-8 h-8 rounded-md" />
            <div className="skeleton w-8 h-8 rounded-md" />
          </div>
        </div>
      )),
    [pageSize]
  );

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="skeleton-loader">
        {skeletonItems}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto rounded-[24px] h-full flex flex-col" data-testid="tokenList">
      <div className="flex-1 overflow-y-auto">
        <TokenListContent
          balances={balances}
          isLoading={isLoading}
          address={address}
          pageSize={pageSize}
          isGroup={isGroup}
          admin={admin}
        />
      </div>
    </div>
  );
};
