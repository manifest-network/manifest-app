import React from 'react';

import ConvertForm from '@/components/bank/forms/convertForm';
import { CombinedBalanceInfo } from '@/utils';

export default React.memo(function ConvertBox({
  address,
  balances,
  isBalancesLoading,
  isGroup,
  admin,
}: {
  address: string;
  balances?: CombinedBalanceInfo;
  target?: CombinedBalanceInfo;
  isBalancesLoading: boolean;
  selectedDenom?: string;
  isGroup?: boolean;
  admin?: string;
}) {
  return (
    <ConvertForm
      address={address}
      balances={balances}
      isBalancesLoading={isBalancesLoading}
      isGroup={isGroup}
      admin={admin}
    />
  );
});
