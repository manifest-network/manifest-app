import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { PiInfo } from 'react-icons/pi';

import { DenomDisplay, TokenBalance } from '@/components';
import BurnModal from '@/components/factory/modals/BurnModal';
import MintModal from '@/components/factory/modals/MintModal';
import TransferModal from '@/components/factory/modals/TransferModal';
import { DenomInfoModal } from '@/components/factory/modals/denomInfo';
import UpdateDenomMetadataModal from '@/components/factory/modals/updateDenomMetadata';
import { BurnIcon, MintIcon, TransferIcon } from '@/components/icons';
import { Pagination } from '@/components/react/Pagination';
import useIsMobile from '@/hooks/useIsMobile';
import { ExtendedMetadataSDKType, truncateString } from '@/utils';

type DenomListProps = {
  denoms: ExtendedMetadataSDKType[];
  isLoading: boolean;
  address: string;
  pageSize: number;
  isGroup?: boolean;
  admin: string;
  searchTerm?: string;
};

export default function DenomList({
  denoms,
  isLoading,
  address,
  pageSize,
  isGroup = false,
  admin,
  searchTerm = '',
}: Readonly<DenomListProps>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openUpdateDenomMetadataModal, setOpenUpdateDenomMetadataModal] = useState(false);

  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedDenom, setSelectedDenom] = useState<ExtendedMetadataSDKType | null>(null);
  const [modalType, setModalType] = useState<
    'mint' | 'burn' | 'multimint' | 'multiburn' | 'update' | 'info' | 'transfer' | null
  >(null);

  const filteredDenoms = useMemo(
    () => denoms.filter(denom => denom?.display.toLowerCase().includes(searchTerm.toLowerCase())),
    [denoms, searchTerm]
  );

  const updateUrlWithModal = (action: string, denomBase?: string) => {
    const query: Record<string, string> = isGroup ? { policyAddress: admin, tab: 'tokens' } : {};

    if (action) query.action = action;
    if (denomBase) query.denom = denomBase;

    router.push(
      {
        pathname: isGroup ? '/groups' : '/factory',
        query,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleDenomSelect = (denom: ExtendedMetadataSDKType) => {
    if (!modalType) {
      setSelectedDenom(denom);
      setModalType('info');
      // Update URL after a brief delay to ensure modal state is set first
      setTimeout(() => {
        updateUrlWithModal('info', denom.base);
      }, 50);
    }
  };

  useEffect(() => {
    const { denom, action } = router.query;
    if (denom && typeof denom === 'string') {
      const metadata = denoms.find(d => d.base === denom);
      if (metadata) {
        setSelectedDenom(metadata);
        if (
          action === 'mint' ||
          action === 'burn' ||
          action === 'multimint' ||
          action === 'multiburn' ||
          action === 'update' ||
          action === 'transfer' ||
          action === 'info'
        ) {
          setModalType(
            action as 'mint' | 'burn' | 'multimint' | 'multiburn' | 'update' | 'info' | 'transfer'
          );
          if (action === 'update') {
            setOpenUpdateDenomMetadataModal(true);
          }
        } else {
          setModalType('info');
        }
      }
    } else {
      setSelectedDenom(null);
      setModalType(null);
    }
  }, [router.query, denoms]);

  const handleCloseModal = () => {
    setSelectedDenom(null);
    setModalType(null);
    setOpenUpdateDenomMetadataModal(false);
    updateUrlWithModal('');
  };

  const handleUpdateModalClose = () => {
    setSelectedDenom(null);
    setOpenUpdateDenomMetadataModal(false);
    setModalType(null);
    updateUrlWithModal('');
  };

  const handleTransferModal = (denom: ExtendedMetadataSDKType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDenom(denom);
    setModalType('transfer');
    updateUrlWithModal('transfer', denom.base);
  };

  const handleModalClose = () => {
    setSelectedDenom(null);
    setModalType(null);
    // Remove modal type from URL
    router.push(
      {
        pathname: isGroup ? '/groups' : '/factory',
        query: isGroup ? { policyAddress: admin, tab: 'tokens' } : undefined,
      },
      undefined,
      { shallow: true }
    );
  };

  const handleMint = (denom: ExtendedMetadataSDKType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDenom(denom);
    setModalType('mint');
    updateUrlWithModal('mint', denom.base);
  };

  const handleBurn = (denom: ExtendedMetadataSDKType, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDenom(denom);
    setModalType('burn');
    updateUrlWithModal('burn', denom.base);
  };

  const handleUpdate = (denom: ExtendedMetadataSDKType) => {
    setSelectedDenom(denom);
    setOpenUpdateDenomMetadataModal(true);
    updateUrlWithModal('update', denom.base);
  };

  const queryInvalidations = ({
    all = false,
    metadata = false,
    amount = false,
    proposal = false,
  }: {
    all?: boolean;
    metadata?: boolean;
    amount?: boolean;
    proposal?: boolean;
  }) => {
    const queryKeys = new Set<string>();

    if (all || metadata) {
      queryKeys.add('allMetadatas');
      queryKeys.add('denoms');
    }

    if (all || amount) {
      queryKeys.add('balances');
      queryKeys.add('totalSupply');
    }

    if (all || proposal) {
      queryKeys.add('proposalInfo');
    }

    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  return (
    <>
      <Pagination
        pageSize={pageSize}
        selectedPage={currentPage - 1}
        dataset={filteredDenoms ?? []}
        data-testid="denomList"
        onChange={(_data: ExtendedMetadataSDKType[], page: number) => setCurrentPage(page + 1)}
      >
        <table className="table w-full border-separate border-spacing-y-3">
          <thead className="sticky top-0 bg-[#F0F0FF] dark:bg-[#0E0A1F]">
            <tr className="text-sm font-medium">
              <th className="bg-transparent w-1/4">Token</th>
              <th className="bg-transparent w-2/5 xl:table-cell hidden">Name</th>
              <th className="bg-transparent w-2/5  md:table-cell hidden">Total Supply</th>
              <th className="bg-transparent w-1/4">Actions</th>
            </tr>
          </thead>
          <tbody className="space-y-4">
            {isLoading ? (
              Array(isMobile ? 4 : 8)
                .fill(0)
                .map((_, index) => <SkeletonRow key={index} index={index} />)
            ) : (
              <Pagination.Data.Consumer>
                {data =>
                  data.map(denom => (
                    <TokenRow
                      key={denom.base}
                      denom={denom}
                      onSelectDenom={() => handleDenomSelect(denom)}
                      onMint={e => handleMint(denom, e)}
                      onBurn={e => handleBurn(denom, e)}
                      onTransfer={e => handleTransferModal(denom, e)}
                      onUpdate={() => handleUpdate(denom)}
                    />
                  ))
                }
              </Pagination.Data.Consumer>
            )}
          </tbody>
        </table>
        <div className="mt-6  w-full justify-center md:hidden block">
          <Link
            href={
              isGroup
                ? `/factory/create?isGroup=${isGroup}&groupPolicyAddress=${admin}`
                : '/factory/create'
            }
            passHref
          >
            <button className="btn btn-gradient w-full h-[52px] text-white rounded-[12px]">
              Create New Token
            </button>
          </Link>
        </div>
      </Pagination>

      <div className="flex items-center justify-between">
        <Link
          href={
            isGroup
              ? `/factory/create?isGroup=${isGroup}&groupPolicyAddress=${admin}`
              : '/factory/create'
          }
          passHref
        >
          <button className="btn btn-gradient w-[224px] h-[52px] hidden md:block text-white rounded-[12px] focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary">
            Create New Token
          </button>
        </Link>
      </div>

      <DenomInfoModal
        open={modalType === 'info'}
        onClose={handleCloseModal}
        denom={selectedDenom}
      />
      <MintModal
        admin={admin}
        denom={modalType === 'mint' ? selectedDenom : null}
        address={address}
        refetch={() => queryInvalidations({ all: true })}
        totalSupply={selectedDenom?.totalSupply ?? '0'}
        isOpen={modalType === 'mint'}
        onClose={handleCloseModal}
        isGroup={isGroup}
      />
      <BurnModal
        admin={admin}
        denom={selectedDenom}
        address={address}
        balance={selectedDenom?.balance ?? '0'}
        totalSupply={selectedDenom?.totalSupply ?? '0'}
        isOpen={modalType === 'burn'}
        onClose={handleCloseModal}
        isGroup={isGroup}
        refetch={() => queryInvalidations({ all: true })}
      />
      <UpdateDenomMetadataModal
        isOpen={openUpdateDenomMetadataModal}
        onClose={handleUpdateModalClose}
        denom={selectedDenom}
        address={address}
        admin={admin}
        isGroup={isGroup}
        refetch={() => queryInvalidations({ metadata: true, proposal: true })}
      />
      <TransferModal
        denom={selectedDenom}
        address={address}
        isOpen={modalType === 'transfer'}
        onClose={handleModalClose}
        refetch={() => {
          queryInvalidations({ metadata: true, proposal: true });
          handleModalClose();
        }}
        admin={admin}
        isGroup={isGroup}
      />
    </>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr>
      <td className="bg-secondary rounded-l-[12px] w-1/4">
        <div className="flex items-center space-x-3">
          <div
            className="skeleton w-10 h-10 rounded-full shrink-0"
            aria-label={`skeleton-${index}-avatar`}
          />
          <div>
            <div className="skeleton h-4 w-20 mb-1" aria-label={`skeleton-${index}-ticker`} />
            <div
              className="skeleton h-3 w-16 xxs:max-xs:hidden"
              aria-label={`skeleton-${index}-symbol`}
            />
          </div>
        </div>
      </td>
      <td className="bg-secondary w-2/5 xl:table-cell hidden">
        <div className="skeleton h-4 w-32" aria-label={`skeleton-${index}-name`} />
      </td>
      <td className="bg-secondary w-2/5 md:table-cell hidden">
        <div className="skeleton h-4 w-28" aria-label={`skeleton-${index}-supply`} />
      </td>
      <td className="bg-secondary rounded-r-[12px] w-1/4">
        <div className="flex space-x-2">
          <button className="btn btn-md btn-outline btn-square btn-primary" disabled>
            <MintIcon className="w-7 h-7 text-current opacity-50" />
          </button>
          <button className="btn btn-md btn-outline btn-square btn-primary" disabled>
            <BurnIcon className="w-7 h-7 text-current opacity-50" />
          </button>
          <button className="btn btn-md btn-outline btn-square btn-info" disabled>
            <TransferIcon className="w-7 h-7 text-current opacity-50" />
          </button>
          <button className="btn btn-md btn-outline btn-square btn-info" disabled>
            <PiInfo className="w-7 h-7 text-current opacity-50" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TokenRow({
  denom,
  onSelectDenom,
  onMint,
  onBurn,
  onTransfer,
  onUpdate,
}: {
  denom: ExtendedMetadataSDKType;
  onSelectDenom: () => void;
  onMint: (e: React.MouseEvent) => void;
  onBurn: (e: React.MouseEvent) => void;
  onTransfer: (e: React.MouseEvent) => void;
  onUpdate: () => void;
}) {
  // Add safety checks for the values
  const totalSupply = denom?.totalSupply ?? '0';

  return (
    <tr
      className="group text-black dark:text-white rounded-lg cursor-pointer transition-colors"
      onClick={onSelectDenom}
    >
      <td className="bg-secondary group-hover:bg-base-300 rounded-l-[12px] w-1/4">
        <div className="flex items-center space-x-3">
          <DenomDisplay metadata={denom} />
        </div>
      </td>
      <td className="bg-secondary group-hover:bg-base-300 w-2/5 xl:table-cell hidden">
        {truncateString(denom?.name ?? 'No name provided', 20)}
      </td>
      <td className="bg-secondary group-hover:bg-base-300 w-2/5 md:table-cell hidden sm:w-1/4">
        <TokenBalance token={{ amount: totalSupply, metadata: denom }} />
      </td>
      <td
        className="bg-secondary group-hover:bg-base-300 rounded-r-[12px] w-1/4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex space-x-2">
          <div
            className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
            data-tip="Mint Token"
          >
            <button
              className="btn btn-sm sm:btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline-primary hover:outline-1 outline-hidden"
              onClick={onMint}
            >
              <MintIcon className="w-4 h-4 sm:w-7 sm:h-7 text-current" />
            </button>
          </div>

          <div
            className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
            data-tip="Burn Token"
          >
            <button
              disabled={denom.base === 'umfx'}
              className="btn btn-sm sm:btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline-primary hover:outline-1 outline-hidden"
              onClick={onBurn}
            >
              <BurnIcon className="w-4 h-4 sm:w-7 sm:h-7 text-current" />
            </button>
          </div>

          <div
            className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
            data-tip="Transfer Token Ownership"
          >
            <button
              disabled={denom.base === 'umfx'}
              className="btn btn-sm sm:btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline-primary hover:outline-1 outline-hidden"
              onClick={onTransfer}
            >
              <TransferIcon className="w-4 h-4 sm:w-7 sm:h-7 text-current" />
            </button>
          </div>

          <div
            className="tooltip tooltip-left tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
            data-tip="Token Details"
          >
            <button
              disabled={denom.base === 'umfx'}
              className="btn btn-sm sm:btn-md bg-base-300 text-primary btn-square group-hover:bg-secondary hover:outline-primary hover:outline-1 outline-hidden"
              onClick={onUpdate}
            >
              <PiInfo className="w-4 h-4 sm:w-7 sm:h-7 text-current" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
