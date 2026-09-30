import BigNumber from 'bignumber.js';

import { MFX_TOKEN_BASE, getDisplayExponent } from '@/utils';
import Yup from '@/utils/yupExtensions';

function amountToBN(amount: string, selectedToken: any) {
  const exponent = getDisplayExponent(selectedToken.metadata);
  return new BigNumber(amount).div(Math.pow(10, exponent));
}

const MIN_FEE_BUFFER = 0.09;

export const schema = Yup.object().shape({
  recipient: Yup.string()
    .required('Recipient is required')
    .manifestAddress()
    .test('recipient-has-prefix', 'Recipient prefix must match recipient chain', function (value) {
      if (!value) return true;
      return value.startsWith('manifest');
    }),
  amount: Yup.string()
    .matches(/^\d*(\.\d*)?$/, 'Amount must be a number')
    .required('Amount is required')
    .test('is-greater-than-zero', 'Amount must be greater than zero', function (value) {
      return new BigNumber(value || 0).gt(0);
    })
    .test('sufficient-balance', 'Amount exceeds balance', function (value) {
      const { selectedToken } = this.parent;
      if (!selectedToken || !value) return true;

      const valueBN = new BigNumber(value);
      const balance = amountToBN(selectedToken.amount, selectedToken);

      return valueBN.lte(balance);
    }),

  // TODO: Use the proper type (CombinedBalanceInfo) for selectedToken.
  selectedToken: Yup.mixed<any>().nullable().required('Please select a token'),
  memo: Yup.string().max(255, 'Memo must be less than 255 characters'),
  feeWarning: Yup.mixed()
    .nullable()
    .test('leave-for-fees', 'Please confirm you understand the fee', function () {
      const { amount, selectedToken } = this.parent;
      if (!selectedToken || !amount || selectedToken.denom !== MFX_TOKEN_BASE) {
        return true;
      }

      const balance = amountToBN(selectedToken.amount, selectedToken);
      const hasInsufficientBuffer = amount.gt(balance.minus(MIN_FEE_BUFFER));

      return !hasInsufficientBuffer;
    }),
});

export type SendForm = Yup.InferType<typeof schema>;
