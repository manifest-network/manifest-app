import { useState } from 'react';

import { MultiBurnModal, MultiMintModal } from '@/components/factory/modals';
import { MFX_TOKEN_DATA } from '@/utils/constants';

interface StakeHolderPayoutProps {
  admin: string;
  address: string;
}

export const StakeHolderPayout = ({ admin, address }: StakeHolderPayoutProps) => {
  const [isOpenMint, setIsOpenMint] = useState(false);
  const [isOpenBurn, setIsOpenBurn] = useState(false);

  return (
    <div className="w-full md:w-1/2 h-full bg-secondary rounded-lg p-6 flex flex-col gap-4 shadow-lg">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-secondary-content">Stake Holder Payout</h1>
        <p className="text-secondary-content/80 text-sm">
          Burn MFX or mint MFX to pay out stake holders.
        </p>
      </div>

      <div className="flex flex-row w-full justify-between gap-4 mt-4">
        <button onClick={() => setIsOpenMint(true)} className="btn btn-primary flex-1 text-white">
          Mint MFX
        </button>
        <button onClick={() => setIsOpenBurn(true)} className="btn btn-error flex-1">
          Burn MFX
        </button>
      </div>
      <MultiMintModal
        isOpen={isOpenMint}
        onClose={() => setIsOpenMint(false)}
        admin={admin}
        address={address}
        denom={MFX_TOKEN_DATA}
      />
      <MultiBurnModal
        isOpen={isOpenBurn}
        onClose={() => setIsOpenBurn(false)}
        admin={admin}
        address={address}
        denom={MFX_TOKEN_DATA}
      />
    </div>
  );
};
