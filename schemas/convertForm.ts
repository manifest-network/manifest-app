import BigNumber from 'bignumber.js';

import Yup from '@/utils/yupExtensions';

function amountToBN(amount: string, selectedToken: any) {
  const exponent = selectedToken.metadata?.denom_units[1]?.exponent ?? 6;
  return new BigNumber(amount).div(Math.pow(10, exponent));
}

export const schema = Yup.object().shape({
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

  selectedToken: Yup.mixed<any>().nullable().required('Please select a token'),
  memo: Yup.string().max(255, 'Memo must be less than 255 characters'),
});

export type ConvertForm = Yup.InferType<typeof schema>;
