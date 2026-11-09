import { cosmos, liftedinit, osmosis } from '@manifest-network/manifestjs';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { MsgBurnHeldBalance } from '@manifest-network/manifestjs/dist/codegen/liftedinit/manifest/v1/tx';
import { MsgBurn } from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';
import BigNumber from 'bignumber.js';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';

import { NumberInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import {
  ExtendedMetadataSDKType,
  amountPrecisionError,
  getDisplayExponent,
  parseNumberToBigInt,
  shiftDigits,
  truncateString,
} from '@/utils';
import Yup from '@/utils/yupExtensions';

interface BurnFormProps {
  isAdmin: boolean;
  admin: string;
  denom: ExtendedMetadataSDKType;
  address: string;
  balance: string;
  totalSupply: string;
  isGroup?: boolean;
  refetch: () => void;
}

export default function BurnForm({
  isAdmin,
  admin,
  denom,
  address,
  balance,
  totalSupply,
  isGroup,
  refetch,
}: Readonly<BurnFormProps>) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(admin ? admin : address || '');

  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { burn } = osmosis.tokenfactory.v1beta1.MessageComposer.withTypeUrl;

  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const exponent = getDisplayExponent(denom);
  const isMFX = denom?.base === 'umfx';

  const BurnSchema = Yup.object().shape({
    amount: Yup.number()
      .positive('Amount must be positive')
      .required('Amount is required')
      .test('max-balance', 'Amount exceeds balance', function (value) {
        // Compare the typed amount exactly: as doubles, a large amount can round to the balance.
        return new BigNumber(this.originalValue ?? value).lte(shiftDigits(balance, -exponent));
      })
      // Check the amount as typed. Yup.number() has already made `value` a double, which drops
      // the fraction of large amounts (4503599627370496.5 becomes 4503599627370496).
      .test('display-precision', 'Too many decimal places', function (value) {
        const typed = this.originalValue ?? value;
        const message =
          typed === undefined || typed === '' ? undefined : amountPrecisionError(typed, exponent);
        return message ? this.createError({ message }) : true;
      }),
    recipient: Yup.string().required('Recipient address is required').manifestAddress(),
  });

  const handleBurn = async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      return;
    }
    try {
      const amountInBaseUnits = parseNumberToBigInt(amount, exponent).toString();
      const msg = isGroup
        ? submitProposal({
            groupPolicyAddress: admin,
            messages: [
              Any.fromPartial({
                typeUrl: MsgBurn.typeUrl,
                value: MsgBurn.encode(
                  burn({
                    amount: {
                      amount: amountInBaseUnits,
                      denom: denom.base,
                    },
                    sender: admin,
                    burnFromAddress: admin,
                  }).value
                ).finish(),
              }),
            ],
            metadata: '',
            proposers: [address],
            title: `Burn ${denom.display}`,
            summary: `This proposal will burn ${amount} ${denom.display} from ${recipient}.`,
            exec: 0,
          })
        : burn({
            amount: {
              amount: amountInBaseUnits,
              denom: denom.base,
            },
            sender: address,
            burnFromAddress: recipient,
          });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          setAmount('');
          refetch();
        },
      });
    } catch (error) {
      console.error('Error during burning:', error);
    }
  };

  return (
    <div className="animate-fadeIn text-sm z-10">
      <div className="rounded-lg">
        {isMFX && !isAdmin ? (
          <div className="w-full p-2 justify-center items-center my-auto leading-tight text-xl flex flex-col font-medium text-pretty">
            <span>You must be a member of the admin group to burn MFX.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400 mb-2">NAME</p>
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] p-4 rounded-md">
                  <p className="font-semibold text-md max-w-[20ch] truncate text-black dark:text-white">
                    {denom.name}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400 mb-2">BALANCE</p>
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] p-4 rounded-md">
                  <p className="font-semibold text-md text-black truncate dark:text-white">
                    {Number(shiftDigits(balance, -exponent)).toLocaleString(undefined, {
                      maximumFractionDigits: exponent,
                    })}{' '}
                  </p>
                </div>
              </div>
            </div>
            {!isMFX && (
              <Formik
                initialValues={{ amount: '', recipient: address }}
                validationSchema={BurnSchema}
                onSubmit={values => {
                  setAmount(values.amount);
                  setRecipient(values.recipient);
                  handleBurn();
                }}
                validateOnChange={true}
                validateOnBlur={true}
              >
                {({ isValid, dirty, setFieldValue, errors, touched }) => (
                  <Form>
                    <div className="flex space-x-4 mt-8">
                      <div className="grow relative">
                        <NumberInput
                          showError={false}
                          label="AMOUNT"
                          name="amount"
                          placeholder="Enter amount"
                          value={amount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setAmount(e.target.value || '');
                            setFieldValue('amount', e.target.value || '');
                          }}
                          className={`input input-bordered w-full ${
                            touched.amount && errors.amount ? 'input-error' : ''
                          }`}
                        />
                        {touched.amount && errors.amount && (
                          <div
                            className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                            data-tip={errors.amount}
                          >
                            <div className="w-0 h-0"></div>
                          </div>
                        )}
                      </div>
                      <div className="grow relative">
                        <AddressInput
                          showError={false}
                          label="TARGET"
                          name="recipient"
                          placeholder="Recipient address"
                          disabled={true}
                          value={recipient || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setRecipient(e.target.value || '');
                            setFieldValue('recipient', e.target.value || '');
                          }}
                          className={`input input-bordered w-full transition-none ${
                            touched.recipient && errors.recipient ? 'input-error' : ''
                          }`}
                        />
                        {touched.recipient && errors.recipient && (
                          <div
                            className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                            data-tip={errors.recipient}
                          >
                            <div className="w-0 h-0"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        aria-label={`burn-btn-${denom.base}`}
                        className="btn btn-error disabled:bg-error/40 disabled:text-white/40 btn-md grow text-white"
                        disabled={isSigning || !isValid || !dirty}
                      >
                        {isSigning ? (
                          <span className="loading loading-dots loading-xs"></span>
                        ) : (
                          `Burn ${
                            denom.display.startsWith('factory')
                              ? denom.display.split('/').pop()?.toUpperCase()
                              : truncateString(denom.display, 12)
                          }`
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </>
        )}
      </div>
    </div>
  );
}
