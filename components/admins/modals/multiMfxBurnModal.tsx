import { cosmos, liftedinit } from '@manifest-network/manifestjs';
import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { Field, FieldArray, FieldProps, Form, Formik } from 'formik';
import React, { useState } from 'react';

import { SigningModalDialog } from '@/components';
import { MinusIcon } from '@/components/icons';
import { NumberInput, TextInput } from '@/components/react/inputs';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { getDisplayExponent, parseNumberToBigInt } from '@/utils';
import Yup from '@/utils/yupExtensions';

interface BurnPair {
  address: string;
  amount: string;
}

interface MultiBurnModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: string;
  address: string;
  denom: MetadataSDKType | null;
}

const BurnPairSchema = Yup.object().shape({
  address: Yup.string().manifestAddress().required('Required'),
  amount: Yup.number().positive('Amount must be positive').required('Required'),
});

const MultiBurnSchema = Yup.object().shape({
  burnPairs: Yup.array()
    .of(BurnPairSchema)
    .min(1, 'At least one burn pair is required')
    .test('unique-address', 'Addresses must be unique', function (pairs) {
      if (!pairs) return true;
      const addresses = pairs.map(pair => pair.address);
      const uniqueAddresses = new Set(addresses);
      return uniqueAddresses.size === addresses.length;
    }),
});

export function MultiBurnModal({ isOpen, onClose, admin, address, denom }: MultiBurnModalProps) {
  const [burnPairs, setBurnPairs] = useState([{ address: admin, amount: '' }]);
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { burnHeldBalance } = liftedinit.manifest.v1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const removeBurnPair = (index: number) => {
    setBurnPairs(burnPairs.filter((_, i) => i !== index));
  };

  const handleMultiBurn = async (values: { burnPairs: BurnPair[] }) => {
    try {
      const messages = values.burnPairs.map(pair =>
        burnHeldBalance({
          authority: admin,
          burnCoins: [
            {
              denom: denom?.base ?? '',
              amount: parseNumberToBigInt(pair.amount, getDisplayExponent(denom)).toString(),
            },
          ],
        })
      );

      const encodedMessages = messages.map(msg =>
        Any.fromPartial({
          typeUrl: msg.typeUrl,
          value: liftedinit.manifest.v1.MsgBurnHeldBalance.encode(msg.value).finish(),
        })
      );

      const msg = submitProposal({
        groupPolicyAddress: admin,
        messages: encodedMessages,
        metadata: '',
        proposers: [address],
        title: `Burn MFX`,
        summary: `This proposal includes a multi-burn action for MFX.`,
        exec: 0,
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          onClose();
        },
      });
    } catch (error) {
      console.error('Error during multi-burn:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <SigningModalDialog
      open={isOpen}
      onClose={onClose}
      className="modal modal-open fixed flex p-0 m-0 top-0"
      title={
        <>
          Burn <span className="font-light text-primary">MFX</span>
        </>
      }
      panelClassName="max-w-4xl"
    >
      <div className="py-4 flex flex-col h-[calc(100%-4rem)]">
        <Formik
          initialValues={{ burnPairs }}
          validationSchema={MultiBurnSchema}
          onSubmit={handleMultiBurn}
          validateOnMount={true}
        >
          {({ values, isValid }) => (
            <Form className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold">Burn Pairs</div>
              </div>

              <div className="overflow-y-auto grow px-1 max-h-[40vh]">
                <FieldArray name="burnPairs">
                  {({ remove }) => (
                    <div className="flex flex-col gap-4 overflow-y-auto">
                      {values.burnPairs.map((_pair, index) => (
                        <div
                          key={index}
                          className="flex relative flex-row dark:bg-[#FFFFFF0A] bg-[#FFFFFF] p-4 gap-2 rounded-lg items-end"
                        >
                          {index > 0 && (
                            <div className="absolute -top-2 left-2 text-xs">#{index + 1}</div>
                          )}
                          <div className="grow relative">
                            <Field name={`burnPairs.${index}.address`}>
                              {({ field, meta }: FieldProps) => (
                                <div className="relative">
                                  <TextInput
                                    showError={false}
                                    label="Address"
                                    {...field}
                                    value={admin}
                                    disabled={true}
                                    placeholder="manifest1..."
                                    className={`input input-bordered w-full ${
                                      meta.touched && meta.error ? 'input-error' : ''
                                    }`}
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
                            <Field name={`burnPairs.${index}.amount`}>
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
                                removeBurnPair(index);
                              }}
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
                  onClick={onClose}
                  disabled={isSigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-md w-[calc(50%-8px)] btn-error  text-white"
                  disabled={isSigning || !isValid}
                >
                  {isSigning ? <span className="loading loading-dots loading-md"></span> : 'Burn'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </SigningModalDialog>
  );
}
