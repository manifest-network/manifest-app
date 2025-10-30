import React from 'react';

import { SigningModalDialog } from '@/components';
import { CombinedBalanceInfo } from '@/utils/types';

import ConvertBox from '../components/convertBox';

interface ConvertModalProps {
  modalId?: string;
  address: string;
  balances?: CombinedBalanceInfo;
  isBalancesLoading: boolean;
  isOpen: boolean;
  onClose?: () => void;
  isGroup?: boolean;
  admin?: string;
}

export default function ConvertModal({
  address,
  balances,
  isBalancesLoading,
  isOpen,
  onClose,
  isGroup,
  admin,
}: ConvertModalProps) {
  return (
    <SigningModalDialog
      open={isOpen}
      onClose={() => {
        onClose?.();
      }}
      title="Convert MFX to PWR"
      className="z-10"
    >
      <ConvertBox
        address={address}
        balances={balances}
        isBalancesLoading={isBalancesLoading}
        isGroup={isGroup}
        admin={admin}
      />
    </SigningModalDialog>
  );
}
