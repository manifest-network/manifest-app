import { PlanSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/upgrade/v1beta1/upgrade';
import { useState } from 'react';

import { CancelUpgradeModal, UpgradeModal } from '@/components/admins/modals';
import { useCurrentPlan } from '@/hooks/useQueries';

export const ChainUpgrader = ({ admin, address }: { admin: string; address: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { plan, isPlanLoading } = useCurrentPlan();

  if (isPlanLoading) {
    return (
      <div className="w-full md:w-1/2 h-full bg-secondary relative rounded-lg p-6 flex flex-col gap-4 shadow-lg animate-pulse">
        <div className="absolute top-4 right-4">
          <div className="skeleton h-4 w-32"></div>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-7 w-64"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
        <div className="flex flex-row w-full justify-between gap-4 mt-4">
          <div className="skeleton h-10 flex-1"></div>
          <div className="skeleton h-10 flex-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/2 h-full bg-secondary relative rounded-lg p-6 flex flex-col gap-4 shadow-lg">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-secondary-content">Submit Chain Upgrade Proposal</h1>
        <p className="text-secondary-content/80 text-sm">
          Submit a proposal to instantiate a chain upgrade.
        </p>
      </div>

      <div className="flex flex-row w-full justify-between gap-4 mt-4">
        <button
          disabled={!!plan}
          onClick={() => setIsOpen(true)}
          className="btn btn-primary flex-1 text-white"
        >
          Upgrade Chain
        </button>
        <button
          disabled={!plan}
          onClick={() => setIsCancelOpen(true)}
          className="btn btn-error flex-1"
        >
          Cancel Upgrade
        </button>
      </div>
      <UpgradeModal
        address={address}
        admin={admin}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <CancelUpgradeModal
        plan={plan ?? ({} as PlanSDKType)}
        admin={admin}
        address={address}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
      />
    </div>
  );
};
