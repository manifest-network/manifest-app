import { Tab } from '@headlessui/react';
import { Fragment, useState } from 'react';
import React from 'react';

import env from '@/config/env';
import { useTx } from '@/hooks';
import { CombinedBalanceInfo } from '@/utils/types';

import IbcSendForm from '../forms/ibcSendForm';
import SendForm from '../forms/sendForm';

export interface IbcChain {
  id: string;
  name: string;
  icon: string;
  prefix: string;
  chainID: string;
}

export default React.memo(function SendBox({
  address,
  balances,
  isBalancesLoading,
  selectedDenom,
  isGroup,
  admin,
}: {
  address: string;
  balances: CombinedBalanceInfo[];
  isBalancesLoading: boolean;
  selectedDenom?: string;
  isGroup?: boolean;
  admin?: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const { isSigning } = useTx(env.chain);
  const allowCrossChainTransfer = !isGroup;

  return (
    <Tab.Group as="div" defaultIndex={activeTab} onChange={setActiveTab}>
      <Tab.List className="relative flex p-3 h-[3.5rem] w-full space-x-1 mb-4 md:mb-6 rounded-2xl bg-surface-inset">
        <div
          className={`absolute transition-all duration-200 ease-in-out h-[calc(100%-8px)] w-[calc(50%-4px)] top-1 rounded-xl bg-surface-raised ${
            activeTab === 0 ? 'left-1' : 'left-[calc(50%+1px)]'
          }`}
        />

        <Tab
          aria-label="Send tab"
          disabled={isSigning}
          className="absolute flex-1 top-1 left-1 text-sm font-medium rounded-xl z-10
                h-[calc(100%-8px)] w-[calc(50%-4px)]
                transition-colors ui-selected:text-base-content
                ui-not-selected:text-content-muted
                disabled:text-content-subtle disabled:cursor-not-allowed"
        >
          Send
        </Tab>
        <Tab
          aria-label="Cross chain transfer tab"
          disabled={!allowCrossChainTransfer || isSigning}
          className="absolute flex-1 top-1 right-1 text-sm font-medium rounded-xl z-10
                h-[calc(100%-8px)] w-[calc(50%-4px)]
                transition-colors ui-selected:text-base-content
                ui-not-selected:text-content-muted
                disabled:text-content-subtle disabled:cursor-not-allowed"
        >
          Cross-Chain Transfer
        </Tab>
      </Tab.List>

      <Tab.Panels>
        <Tab.Panel>
          <SendForm
            address={address}
            balances={balances}
            isBalancesLoading={isBalancesLoading}
            selectedDenom={selectedDenom}
            isGroup={isGroup}
            admin={admin}
          />
        </Tab.Panel>

        <Tab.Panel>
          {allowCrossChainTransfer && <IbcSendForm token={selectedDenom ?? 'umfx'} />}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
});
