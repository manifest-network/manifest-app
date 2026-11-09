import { cosmos, liftedinit } from '@manifest-network/manifestjs';
import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { MsgPayout } from '@manifest-network/manifestjs/dist/codegen/liftedinit/manifest/v1/tx';
import { Field, FieldArray, FieldProps, Form, Formik } from 'formik';
import React, { useState } from 'react';

import { SigningModalDialog } from '@/components';
import { MinusIcon, PlusIcon } from '@/components/icons';
import { NumberInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { getDisplayExponent, parseNumberToBigInt, shiftDigits } from '@/utils';
import Yup from '@/utils/yupExtensions';

//TODO: find max mint amount from team for mfx. Find tx size limit for max payout pairs
interface PayoutPair {
  address: string;
  amount: string;
}

interface MultiMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: string;
  address: string;
  denom: MetadataSDKType | null;
}

const PayoutPairSchema = Yup.object().shape({
  address: Yup.string().manifestAddress().required('Required'),
  amount: Yup.number().positive('Amount must be positive').required('Required'),
});

const MultiMintSchema = Yup.object().shape({
  payoutPairs: Yup.array()
    .of(PayoutPairSchema)
    .max(100, 'Maximum 100 payout pairs allowed')
    .min(1, 'At least one payout pair is required')
    .test('unique-address', 'Addresses must be unique', function (pairs) {
      if (!pairs) return true;
      const addresses = pairs.map(pair => pair.address);
      const uniqueAddresses = new Set(addresses);
      return uniqueAddresses.size === addresses.length;
    }),
});

export function MultiMintModal({ isOpen, onClose, admin, address, denom }: MultiMintModalProps) {
  const [payoutPairs, setPayoutPairs] = useState([{ address: '', amount: '' }]);
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { payout } = liftedinit.manifest.v1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const updatePayoutPair = (index: number, field: 'address' | 'amount', value: string) => {
    const newPairs = [...payoutPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setPayoutPairs(newPairs);
  };

  const addPayoutPair = () => {
    setPayoutPairs([...payoutPairs, { address: '', amount: '' }]);
  };

  const removePayoutPair = (index: number) => {
    setPayoutPairs(payoutPairs.filter((_, i) => i !== index));
  };

  const handleMultiMint = async (values: { payoutPairs: PayoutPair[] }) => {
    try {
      const exponent = getDisplayExponent(denom);
      const payoutMsg = payout({
        authority: admin,
        payoutPairs: values.payoutPairs.map(pair => ({
          address: pair.address,
          coin: {
            denom: denom?.base ?? '',
            amount: parseNumberToBigInt(pair.amount, exponent).toString(),
          },
        })),
      });

      const encodedMessage = Any.fromPartial({
        typeUrl: payoutMsg.typeUrl,
        value: MsgPayout.encode(payoutMsg.value).finish(),
      });

      const msg = submitProposal({
        groupPolicyAddress: admin,
        messages: [encodedMessage],
        metadata: '',
        proposers: [address],
        title: `Multi Mint MFX`,
        summary: `This proposal includes a multi-mint action for MFX.`,
        exec: 0,
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          onClose();
        },
      });
    } catch (error) {
      console.error('Error during multi-mint:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <SigningModalDialog
      open={isOpen}
      onClose={onClose}
      panelClassName="max-w-4xl"
      title={
        <>
          Multi Mint <span className="font-light text-primary">MFX</span>
        </>
      }
    >
      <div className="py-4 flex flex-col h-[calc(100%-4rem)]">
        <Formik
          initialValues={{ payoutPairs }}
          validationSchema={MultiMintSchema}
          onSubmit={handleMultiMint}
          validateOnMount={true}
        >
          {({ values, isValid, setFieldValue }) => (
            <Form className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold">Payout Pairs</div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary text-white"
                  onClick={() => {
                    // Update both Formik state and parent component state
                    setFieldValue('payoutPairs', [
                      ...values.payoutPairs,
                      { address: '', amount: '' },
                    ]);
                    addPayoutPair();
                  }}
                  disabled={isSigning}
                >
                  <PlusIcon className="text-lg" />
                  <span className="ml-1">Add Payout</span>
                </button>
              </div>

              <div className="overflow-y-auto grow px-1 max-h-[40vh]">
                <FieldArray name="payoutPairs">
                  {({ remove }) => (
                    <div className="flex flex-col gap-4 overflow-y-auto">
                      {values.payoutPairs.map((pair, index) => (
                        <div
                          key={index}
                          className="flex relative flex-row dark:bg-[#FFFFFF0A] bg-[#FFFFFF] h-full p-4 gap-2 rounded-lg items-end"
                        >
                          {index > 0 && (
                            <div className="absolute -top-2 left-2 text-xs">#{index + 1}</div>
                          )}
                          <div className="grow relative">
                            <Field name={`payoutPairs.${index}.address`}>
                              {({ field, meta }: FieldProps) => (
                                <div className="relative">
                                  <AddressInput
                                    showError={false}
                                    label="Address"
                                    {...field}
                                    placeholder="manifest1..."
                                    className={`input input-bordered w-full ${
                                      meta.touched && meta.error ? 'input-error' : ''
                                    }`}
                                    disabled={isSigning}
                                  />
                                  {meta.touched && meta.error && (
                                    <div
                                      className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                                      data-tip={meta.error}
                                    ></div>
                                  )}
                                </div>
                              )}
                            </Field>
                          </div>
                          <div className="grow relative">
                            <Field name={`payoutPairs.${index}.amount`}>
                              {({ field, meta }: FieldProps) => (
                                <div className="relative">
                                  <NumberInput
                                    showError={false}
                                    label="Amount"
                                    {...field}
                                    placeholder="Enter amount"
                                    className={`input input-bordered w-full ${
                                      meta.touched && meta.error ? 'input-error' : ''
                                    }`}
                                    disabled={isSigning}
                                  />
                                  {meta.touched && meta.error && (
                                    <div
                                      className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                                      data-tip={meta.error}
                                    ></div>
                                  )}
                                </div>
                              )}
                            </Field>
                          </div>
                          {index > 0 && (
                            <button
                              type="button"
                              className="btn btn-error btn-sm text-white absolute top-3 right-5"
                              onClick={() => {
                                remove(index);
                                removePayoutPair(index);
                              }}
                              aria-label="Remove payout pair"
                            >
                              <MinusIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="mt-4 gap-6 flex justify-center w-full p-2">
                <button
                  type="button"
                  className="btn w-[calc(50%-8px)] btn-md focus:outline-hidden dark:bg-[#FFFFFF0F] bg-[#0000000A]"
                  disabled={isSigning}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-md w-[calc(50%-8px)] btn-gradient  text-white"
                  disabled={isSigning || !isValid}
                >
                  {isSigning ? (
                    <span className="loading loading-dots loading-md"></span>
                  ) : (
                    'Multi Mint'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </SigningModalDialog>
  );
}
