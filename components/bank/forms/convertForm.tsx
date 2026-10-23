import { toUtf8 } from '@cosmjs/encoding';
import { StdFee } from '@cosmjs/stargate';
import { cosmos, cosmwasm } from '@manifest-network/manifestjs';
import {
  DenomUnit,
  DenomUnitSDKType,
  Metadata,
  MetadataSDKType,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { MsgExecuteContract } from '@manifest-network/manifestjs/dist/codegen/cosmwasm/wasm/v1/tx';
import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';

import { AmountInput, MaxButton, TokenBalance } from '@/components';
import { DenomDisplay } from '@/components/factory';
import { TextInput } from '@/components/react/inputs';
import env from '@/config/env';
import { useToast } from '@/contexts';
import { useFeeEstimation, useMfxPwrConversionConfig, useTokenMetadata, useTx } from '@/hooks';
import { convertForm } from '@/schemas';
import { parseNumberToBigInt } from '@/utils';
import { CombinedBalanceInfo } from '@/utils/types';

function toDenomUnitSDKType(du: DenomUnit): DenomUnitSDKType {
  return {
    denom: du.denom ?? '',
    exponent: du.exponent ?? 0,
    aliases: du.aliases ?? [],
  };
}

export function toMetadataSDKType(m?: Metadata | null): MetadataSDKType | undefined {
  if (!m) return undefined;
  return {
    description: m.description ?? '',
    denom_units: (m.denomUnits ?? []).map(toDenomUnitSDKType),
    base: m.base ?? '',
    display: m.display ?? '',
    name: m.name ?? '',
    symbol: m.symbol ?? '',
    uri: m.uri ?? '',
    uri_hash: m.uriHash ?? '',
  };
}

export default function ConvertForm({
  address,
  balances,
  isBalancesLoading,
  isGroup,
  admin,
}: Readonly<{
  address: string;
  balances?: CombinedBalanceInfo;
  isBalancesLoading: boolean;
  isGroup?: boolean;
  admin?: string;
}>) {
  const {
    config,
    isConfigLoading,
    isConfigError,
    error: configError,
  } = useMfxPwrConversionConfig();
  const {
    metadata,
    isMetadataLoading,
    isMetadataError,
    error: metadataError,
  } = useTokenMetadata(config?.target_denom);
  const queryClient = useQueryClient();
  const { setToastMessage } = useToast();

  const { isSigning, tx } = useTx(env.chain);
  const { estimateFee, estimateMax, isFeeDenom } = useFeeEstimation(env.chain);
  // Fee worked out by MAX, used as-is when converting exactly that amount so amount + fee
  // matches the balance.
  const [maxConvert, setMaxConvert] = useState<{
    denom: string;
    amount: string;
    fee: StdFee;
  } | null>(null);
  const { executeContract } = cosmwasm.wasm.v1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const initialSelectedToken = balances;

  useEffect(() => {
    if (isConfigError && configError) {
      setToastMessage({
        type: 'alert-error',
        title: 'Error loading conversion config',
        description: configError.message,
        bgColor: '#e74c3c',
      });
    }
  }, [isConfigError, configError, setToastMessage]);

  useEffect(() => {
    if (isMetadataError && metadataError) {
      setToastMessage({
        type: 'alert-error',
        title: 'Error loading token metadata',
        description: metadataError.message,
        bgColor: '#e74c3c',
      });
    }
  }, [isMetadataError, metadataError, setToastMessage]);

  const rate = BigNumber(config?.rate ?? 1);
  const validationSchema = convertForm.schema;

  const msgConvert = toUtf8(JSON.stringify({ convert: {} }));

  function applyRate(amount: string) {
    const amountBN = new BigNumber(amount || 0);
    const receiveAmount = amountBN.multipliedBy(rate).decimalPlaces(6, BigNumber.ROUND_DOWN);
    return receiveAmount.toString();
  }

  const buildConvertMsg = (denom: string, amount: string, display?: string) =>
    isGroup
      ? submitProposal({
          groupPolicyAddress: admin!,
          messages: [
            Any.fromPartial({
              typeUrl: MsgExecuteContract.typeUrl,
              value: MsgExecuteContract.encode(
                executeContract({
                  contract: env.mfxToPwrConversionContractAddress,
                  funds: [{ denom, amount }],
                  msg: msgConvert,
                  sender: admin!,
                }).value
              ).finish(),
            }),
          ],
          metadata: '',
          proposers: [address],
          title: `Convert MFX to PWR`,
          summary: `This proposal will convert ${display} to PWR`,
          exec: 0,
        })
      : executeContract({
          contract: env.mfxToPwrConversionContractAddress,
          funds: [{ denom, amount }],
          msg: msgConvert,
          sender: address,
        });

  // A group conversion is paid from the policy while the fee is paid by the proposer, so
  // MAX is the whole balance there.
  const estimateMaxConvert = isGroup
    ? undefined
    : async (token: CombinedBalanceInfo, memo?: string) => {
        const max = await estimateMax(
          address,
          token.base,
          amount => buildConvertMsg(token.base, amount),
          memo
        );
        setMaxConvert(max?.fee ? { denom: token.base, amount: max.amount, fee: max.fee } : null);
        return max?.amount ?? null;
      };

  const handleConvert = async (values: convertForm.ConvertForm) => {
    try {
      const exponent = values.selectedToken.metadata?.denom_units[1]?.exponent ?? 6;
      const amountInBaseUnits = parseNumberToBigInt(values.amount.toString(), exponent).toString();
      const denom = values.selectedToken.base;

      const msg = buildConvertMsg(
        denom,
        amountInBaseUnits,
        `${values.amount} ${values.selectedToken.metadata?.display}`
      );
      const maxFee =
        maxConvert && maxConvert.denom === denom && maxConvert.amount === amountInBaseUnits
          ? maxConvert.fee
          : null;

      await tx([msg], {
        memo: values.memo,
        fee: maxFee ?? (() => estimateFee(address, [msg])),
        onSuccess: () => {
          setMaxConvert(null);
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          queryClient.invalidateQueries({ queryKey: ['balances-resolved'] });
          queryClient.invalidateQueries({ queryKey: ['getMessagesForAddress'] });
          queryClient.invalidateQueries({ queryKey: ['proposalInfo'] });
          queryClient.invalidateQueries({ queryKey: ['allMetadatas'] });
          queryClient.invalidateQueries({ queryKey: ['metadata'] });
        },
      });
    } catch (error) {
      console.error('Error during convert:', error);
    }
  };

  const initialValues: convertForm.ConvertForm = {
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
        onSubmit={handleConvert}
      >
        {({ isValid, dirty, setFieldValue, values, errors, handleChange }) => {
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
                      placeholder="1.00"
                      name="amount"
                      className="pr-[11rem]"
                      value={values.amount}
                      onValueChange={value => {
                        setFieldValue('amount', value?.toFixed());
                      }}
                    />

                    <div className="absolute inset-y-1 right-1 flex items-center">
                      <DenomDisplay
                        withBackground={false}
                        denom={
                          values.selectedToken?.metadata?.display ?? values.selectedToken?.display
                        }
                        metadata={values.selectedToken?.metadata}
                      />
                    </div>
                  </div>
                  <div className="text-xs mt-1 flex justify-between text-[#00000099] dark:text-[#FFFFFF99]">
                    {isBalancesLoading ? (
                      <div className="skeleton h-4 w-24" aria-label="balance-skeleton" />
                    ) : (
                      <div className="flex flex-row gap-1 ml-1">
                        Balance: <TokenBalance token={balances ?? values.selectedToken} />
                        <MaxButton
                          token={values.selectedToken}
                          setTokenAmount={(amount: string) => setFieldValue('amount', amount)}
                          disabled={isSigning}
                          estimateMax={
                            estimateMaxConvert && (token => estimateMaxConvert(token, values.memo))
                          }
                          feeDeducted={!isGroup && isFeeDenom(values.selectedToken.base)}
                        />
                      </div>
                    )}
                    {errors.amount && (
                      <div className="text-red-500 text-xs text-right">{errors.amount}</div>
                    )}
                    {errors.feeWarning && !errors.amount && (
                      <div className="text-yellow-500 text-xs">{errors.feeWarning}</div>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-md font-medium text-[#00000099] dark:text-[#FFFFFF99]">
                      Receiving Amount
                    </span>
                  </label>
                  <div className="relative">
                    <AmountInput
                      disabled={true}
                      name="receive-amount"
                      className="pr-[11rem]"
                      value={applyRate(values.amount)}
                      onValueChange={() => {}}
                    />

                    {isMetadataLoading ? (
                      <div className="absolute inset-y-1 right-1 flex items-center">
                        <div className="skeleton h-6 w-20" aria-label="metadata-skeleton" />
                      </div>
                    ) : (
                      <div className="absolute inset-y-1 right-1 flex items-center">
                        <DenomDisplay
                          withBackground={false}
                          denom={metadata?.display ? metadata.display : 'PWR'}
                          metadata={toMetadataSDKType(metadata)}
                        />
                      </div>
                    )}
                  </div>
                  {isConfigLoading ? (
                    <div className="skeleton h-4 w-32 mt-1" aria-label="config-skeleton" />
                  ) : (
                    <div className="text-xs mt-1 flex justify-between text-[#00000099] dark:text-[#FFFFFF99]">
                      <div className="flex flex-row gap-1 ml-1">
                        Conversion Rate: {config?.rate}
                      </div>
                    </div>
                  )}
                </div>

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
                  disabled={isSigning || !isValid || !dirty || isConfigLoading}
                  aria-label="convert-btn"
                >
                  {isSigning ? (
                    <span className="loading loading-dots loading-xs" role="status"></span>
                  ) : (
                    'Convert'
                  )}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
