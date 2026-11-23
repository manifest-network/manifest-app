import { useFormikContext } from 'formik';
import { useEffect } from 'react';

import { CombinedBalanceInfo } from '@/utils/types';

/**
 * Keeps the form's `selectedToken` in step with that token's latest balance. Balances
 * refresh while a form stays open, and the amount is validated against
 * `selectedToken.amount`, so without this it is checked against the balance the form
 * opened with rather than the one on screen.
 */
export function SyncSelectedToken({
  latest,
}: Readonly<{ latest: CombinedBalanceInfo | null | undefined }>) {
  const { values, setFieldValue } = useFormikContext<{ selectedToken?: CombinedBalanceInfo }>();
  const selected = values.selectedToken;

  useEffect(() => {
    if (latest && selected && latest.base === selected.base && latest.amount !== selected.amount) {
      setFieldValue('selectedToken', latest);
    }
  }, [latest, selected, setFieldValue]);

  return null;
}
