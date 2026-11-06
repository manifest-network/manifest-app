import { cosmos } from '@manifest-network/manifestjs';
import { MsgSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';
import { useQueryClient } from '@tanstack/react-query';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Form, Formik } from 'formik';
import React, { useMemo, useState } from 'react';
import { PiCaretDownBold } from 'react-icons/pi';

import { AmountInput, MaxButton, TokenBalance } from '@/components';
import { DenomDisplay } from '@/components/factory';
import { SearchIcon } from '@/components/icons';
import { TextInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { sendForm } from '@/schemas';
import { getDisplayExponent, parseNumberToBigInt } from '@/utils';
import { CombinedBalanceInfo } from '@/utils/types';

export default function SendForm({
  address,
  balances,
  isBalancesLoading,
  selectedDenom,
  isGroup,
  admin,
}: Readonly<{
  address: string;
  balances: CombinedBalanceInfo[];
  isBalancesLoading: boolean;
  selectedDenom?: string;
  isGroup?: boolean;
  admin?: string;
}>) {
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { isSigning, tx } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { send } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const filteredBalances = balances.filter(token => {
    const displayName = token.metadata?.display ?? token.display;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const initialSelectedToken = useMemo(() => {
    return balances?.find(token => token.base === selectedDenom) || balances?.[0] || null;
  }, [balances, selectedDenom]);

  // Loading state checks
  if (isBalancesLoading || !initialSelectedToken) {
    return null;
  }

  const validationSchema = sendForm.schema;

  const handleSend = async (values: sendForm.SendForm) => {
    try {
      const exponent = getDisplayExponent(values.selectedToken.metadata);
      const amountInBaseUnits = parseNumberToBigInt(values.amount.toString(), exponent).toString();

      const msg = isGroup
        ? submitProposal({
            groupPolicyAddress: admin!,
            messages: [
              Any.fromPartial({
                typeUrl: MsgSend.typeUrl,
                value: MsgSend.encode(
                  send({
                    fromAddress: admin!,
                    toAddress: values.recipient,
                    amount: [{ denom: values.selectedToken.base, amount: amountInBaseUnits }],
                  }).value
                ).finish(),
              }),
            ],
            metadata: '',
            proposers: [address],
            title: `Send Tokens`,
            summary: `This proposal will send ${values.amount} ${values.selectedToken.metadata?.display} to ${values.recipient}`,
            exec: 0,
          })
        : send({
            fromAddress: address,
            toAddress: values.recipient,
            amount: [{ denom: values.selectedToken.base, amount: amountInBaseUnits }],
          });

      await tx([msg], {
        memo: values.memo,
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          queryClient.invalidateQueries({ queryKey: ['balances-resolved'] });
          queryClient.invalidateQueries({ queryKey: ['getMessagesForAddress'] });
          queryClient.invalidateQueries({ queryKey: ['proposalInfo'] });
        },
      });
    } catch (error) {
      console.error('Error during sending:', error);
    }
  };

  const initialValues: sendForm.SendForm = {
    recipient: '',
    amount: '',
    selectedToken: initialSelectedToken,
    memo: '',
  };

  return (
    <div
      style={{ borderRadius: '24px' }}
      className="text-sm bg-[#FFFFFFCC] dark:bg-[#FFFFFF0F] px-6 pb-6 pt-4 w-full h-full animate-fadeIn duration-400"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSend}
      >
        {({ isValid, dirty, setFieldValue, values, errors, handleChange }) => {
          // Use direct calculation instead of useMemo
          const selectedTokenBalance = values?.selectedToken
            ? balances?.find(token => token.base === values.selectedToken.base)
            : null;

          return (
            <Form className="space-y-8 flex flex-col items-center max-w-md mx-auto">
              <div className="w-full space-y-8">
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-md font-medium text-[#00000099] dark:text-[#FFFFFF99]">
                      Amount
                    </span>
                  </label>
                  <div className="relative">
                    <AmountInput
                      name="amount"
                      className="pr-[11rem]"
                      value={values.amount}
                      onValueChange={value => {
                        setFieldValue('amount', value?.toFixed());
                      }}
                    />

                    <div className="absolute inset-y-1 right-1 flex items-center">
                      <div className="dropdown dropdown-end h-full">
                        <label
                          aria-label="token-selector"
                          tabIndex={0}
                          className="btn btn-sm h-full px-3 bg-[#FFFFFF] dark:bg-[#FFFFFF0F] border-none hover:bg-transparent"
                        >
                          <DenomDisplay
                            withBackground={false}
                            denom={
                              values.selectedToken?.metadata?.display ??
                              values.selectedToken?.display
                            }
                            metadata={values.selectedToken?.metadata}
                          />
                          <PiCaretDownBold className="ml-1" />
                        </label>
                        <ul
                          tabIndex={0}
                          role="listbox"
                          aria-label="Token selection"
                          className="dropdown-content z-20 p-2 shadow-sm bg-base-300 rounded-lg w-full mt-1 max-h-72 min-w-44 overflow-y-auto dark:text-[#FFFFFF] text-[#161616]"
                        >
                          <li className=" bg-base-300 z-30 hover:bg-transparent h-full mb-2">
                            <div className="px-2 py-1 relative">
                              <input
                                type="text"
                                placeholder="Search tokens..."
                                className="input input-sm w-full pr-8 focus:outline-hidden focus:ring-0 border  border-[#00000033] dark:border-[#FFFFFF33] bg-[#E0E0FF0A] dark:bg-[#E0E0FF0A]"
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ boxShadow: 'none', borderRadius: '8px' }}
                              />
                              <SearchIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                          </li>
                          {isBalancesLoading ? (
                            <li>
                              <a className="block px-4 py-2">Loading tokens...</a>
                            </li>
                          ) : (
                            filteredBalances?.map(token => (
                              <li
                                key={token.base}
                                onClick={() => {
                                  setFieldValue('selectedToken', token);
                                  if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur();
                                  }
                                }}
                                className="hover:bg-[#E0E0FF33] dark:hover:bg-[#FFFFFF0F] cursor-pointer rounded-lg"
                                aria-label={token.metadata?.display}
                              >
                                <a className="flex flex-row items-center gap-2 px-2 py-2">
                                  <DenomDisplay withBackground={false} metadata={token?.metadata} />
                                </a>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs mt-1 flex justify-between text-[#00000099] dark:text-[#FFFFFF99]">
                    <div className="flex flex-row gap-1 ml-1">
                      Balance: <TokenBalance token={selectedTokenBalance ?? values.selectedToken} />
                      <MaxButton
                        token={values.selectedToken}
                        setTokenAmount={(amount: string) => setFieldValue('amount', amount)}
                        disabled={isSigning}
                      />
                    </div>
                    {errors.amount && (
                      <div className="text-red-500 text-xs text-right">{errors.amount}</div>
                    )}
                    {errors.feeWarning && !errors.amount && (
                      <div className="text-yellow-500 text-xs">{errors.feeWarning}</div>
                    )}
                  </div>
                </div>

                <AddressInput
                  name="recipient"
                  label="Send To"
                  placeholder="Enter address"
                  value={values.recipient}
                  onChange={handleChange}
                  className="input-md w-full"
                  style={{ borderRadius: '12px' }}
                />
                <TextInput
                  label="Memo (optional)"
                  name="memo"
                  placeholder="Memo"
                  style={{ borderRadius: '12px' }}
                  value={values.memo}
                  onChange={handleChange}
                  className="input-md w-full"
                />
              </div>

              <div className="w-full">
                <button
                  type="submit"
                  className="btn btn-gradient w-full text-white"
                  disabled={isSigning || !isValid || !dirty}
                  aria-label="send-btn"
                >
                  {isSigning ? <span className="loading loading-dots loading-xs"></span> : 'Send'}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
