import { useChain } from '@cosmos-kit/react';
import { Tab } from '@headlessui/react';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { HistoryBox, TokenList } from '@/components';
import { TxMessage } from '@/components/bank/types';
import DenomList from '@/components/factory/components/DenomList';
import { GroupProposals } from '@/components/groups/components/Proposals';
import { ArrowRightIcon } from '@/components/icons';
import env from '@/config/env';
import useIsMobile from '@/hooks/useIsMobile';
import { ExtendedGroupType, useProposalsByPolicyAccount } from '@/hooks/useQueries';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import { group as groupSchema } from '@/schemas';
import { CombinedBalanceInfo, ExtendedMetadataSDKType } from '@/utils';
import { ProfileAvatar } from '@/utils/identicon';

export type GroupControlsProps = {
  group: ExtendedGroupType;
  onBack: () => void;
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sendTxs: TxMessage[];
  totalPages: number;
  txLoading: boolean;
  isError: boolean;
  balances: CombinedBalanceInfo[];
  denoms: ExtendedMetadataSDKType[];
  pageSize: number;
  skeletonGroupCount: number;
  skeletonTxCount: number;
  proposalPageSize?: number;
};

const TAB_SLUGS = ['proposals', 'assets', 'activity', 'tokens'];

export function GroupControls({
  group,
  onBack,
  isLoading,
  currentPage,
  setCurrentPage,
  sendTxs,
  totalPages,
  txLoading,
  isError,
  balances,
  denoms,
  pageSize,
  skeletonGroupCount,
  skeletonTxCount,
  proposalPageSize = 10,
}: GroupControlsProps) {
  const policyAddress = group?.policies?.[0]?.address ?? '';

  const isMobile = useIsMobile();

  const [activeTab, setActiveTabInner] = useState(0);

  const router = useRouter();

  const setActiveTab = useCallback(
    (tab: number) => {
      setActiveTabInner(tab);
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: TAB_SLUGS[tab],
          },
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  useEffect(() => {
    const { tab } = router.query;
    const maybeIndex = TAB_SLUGS.indexOf(tab as string);
    setActiveTabInner(maybeIndex === -1 ? 0 : maybeIndex);
  }, [router.query]);

  const groupName = useMemo(() => {
    const metadata = groupSchema.metadataFromJson(group.metadata, false);
    return metadata?.title ?? 'Untitled Group';
  }, [group.metadata]);

  const { address } = useChain(env.chain);

  // Add responsive page size configuration
  const sizeLookup = [
    {
      height: 700,
      width: Infinity,
      sizes: { proposals: 6 },
    },
    {
      height: 800,
      width: Infinity,
      sizes: { proposals: 8 },
    },
    {
      height: 1000,
      width: 800,
      sizes: { proposals: 7 },
    },
    {
      height: 1000,
      width: Infinity,
      sizes: { proposals: 8 },
    },
    {
      height: 1300,
      width: Infinity,
      sizes: { proposals: 12 },
    },
  ];

  const defaultSizes = { proposals: proposalPageSize };
  const responsivePageSize = useResponsivePageSize(sizeLookup, defaultSizes);
  const proposalPageSizes = isMobile ? { proposals: 7 } : responsivePageSize;

  return (
    <div className="">
      <div className="flex w-full h-full md:flex-row flex-col md:gap-8">
        <div className="flex flex-col w-full md:w-[48%] h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="btn btn-circle bg-secondary btn-md focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                aria-label="Go back to groups list"
              >
                <ArrowRightIcon className="text-primary" />
              </button>
              <h1 className="text-2xl font-bold text-primary-content truncate">{groupName}</h1>
              <div className="">
                <ProfileAvatar walletAddress={policyAddress} size={40} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tab.Group selectedIndex={activeTab} onChange={tab => setActiveTab(tab)}>
        <Tab.List className="flex flex-row tabs tabs-border tabs-lg">
          <Tab className="font-bold tab ui-selected:tab-active focus:outline-1 focus:outline-primary focus:-outline-offset-1">
            Proposals
          </Tab>
          <Tab className="font-bold tab ui-selected:tab-active focus:outline-1 focus:outline-primary focus:-outline-offset-1">
            Assets
          </Tab>
          <Tab className="font-bold tab ui-selected:tab-active focus:outline-1 focus:outline-primary focus:-outline-offset-1">
            Activity
          </Tab>
          <Tab className="font-bold tab ui-selected:tab-active focus:outline-1 focus:outline-primary focus:-outline-offset-1">
            Tokens
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel unmount={false}>
            <GroupProposals group={group} pageSize={proposalPageSize} />
          </Tab.Panel>

          <Tab.Panel>
            <TokenList
              balances={balances}
              isLoading={isLoading}
              address={address ?? ''}
              pageSize={pageSize}
              isGroup={true}
              admin={policyAddress}
            />
          </Tab.Panel>

          <Tab.Panel>
            <HistoryBox
              isLoading={isLoading}
              address={policyAddress}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              sendTxs={sendTxs}
              totalPages={totalPages}
              txLoading={txLoading}
              isError={isError}
              skeletonGroupCount={skeletonGroupCount}
              skeletonTxCount={skeletonTxCount}
            />
          </Tab.Panel>

          <Tab.Panel className="-mt-7">
            <DenomList
              denoms={denoms}
              isLoading={isLoading}
              address={address ?? ''}
              admin={policyAddress}
              pageSize={pageSize - 1}
              isGroup={true}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
