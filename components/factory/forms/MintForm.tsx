import { cosmos, osmosis } from '@manifest-network/manifestjs';
import { MsgMint } from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';
import { useQueryClient } from '@tanstack/react-query';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { MdContacts } from 'react-icons/md';

import { NumberInput, TextInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import {
  ExtendedMetadataSDKType,
  getDisplayExponent,
  parseNumberToBigInt,
  shiftDigits,
  truncateString,
} from '@/utils';
import Yup from '@/utils/yupExtensions';

export default function MintForm({
  isAdmin,
  denom,
  address,
  totalSupply,
  isGroup,
  refetch,
  admin,
}: Readonly<{
  isAdmin: boolean;
  denom: ExtendedMetadataSDKType;
  address: string;
  totalSupply: string;
  isGroup?: boolean;
  admin?: string;
  refetch: () => void;
}>) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState(address || '');
  const queryClient = useQueryClient();
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { mint } = osmosis.tokenfactory.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const isMFX = denom.base === 'umfx';
  const exponent = getDisplayExponent(denom);

  const MintSchema = Yup.object().shape({
    amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
    recipient: Yup.string().required('Recipient address is required').manifestAddress(),
  });

  const handleMint = async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      return;
    }

    try {
      const amountInBaseUnits = parseNumberToBigInt(amount, exponent).toString();
      let msg;

      msg = isGroup
        ? submitProposal({
            groupPolicyAddress: admin!,
            messages: [
              Any.fromPartial({
                typeUrl: MsgMint.typeUrl,
                value: MsgMint.encode(
                  mint({
                    amount: {
                      amount: amountInBaseUnits,
                      denom: denom.base,
                    },
                    sender: admin!,
                    mintToAddress: recipient,
                  }).value
                ).finish(),
              }),
            ],
            metadata: '',
            proposers: [address],
            title: `Mint Tokens`,
            summary: `This proposal will mint ${amount} ${denom.display} to ${recipient}`,
            exec: 0,
          })
        : mint({
            amount: {
              amount: amountInBaseUnits,
              denom: denom.base,
            },
            sender: address,
            mintToAddress: recipient,
          });

      await tx([msg], {
        fee: () => estimateFee(address ?? '', [msg]),
        onSuccess: () => {
          setAmount('');
          refetch();
        },
      });
    } catch (error) {
      console.error('Error during minting:', error);
    }
  };

  return (
    <div className="animate-fadeIn text-sm z-10">
      <div className="rounded-lg">
        {isMFX && !isAdmin ? (
          <div className="w-full p-2 justify-center items-center my-auto leading-tight text-xl flex flex-col font-medium text-pretty">
            <span>You must be a member of the admin group to mint MFX.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400 mb-2">NAME</p>
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] p-4 rounded-md">
                  <p className="font-semibold text-md  truncate text-black dark:text-white">
                    {denom.name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-light text-gray-500 truncate dark:text-gray-400 mb-2">
                  CIRCULATING SUPPLY
                </p>
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] p-4 rounded-md">
                  <p className="font-semibold text-md truncate text-black dark:text-white">
                    {Number(shiftDigits(totalSupply, -exponent)).toLocaleString(undefined, {
                      maximumFractionDigits: exponent,
                    })}{' '}
                  </p>
                </div>
              </div>
            </div>
            {!isMFX && (
              <Formik
                initialValues={{ amount: '', recipient: address }}
                validationSchema={MintSchema}
                onSubmit={values => {
                  setAmount(values.amount);
                  setRecipient(values.recipient);
                  handleMint();
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
                          label="RECIPIENT"
                          name="recipient"
                          placeholder="Recipient address"
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
                      {!isMFX && (
                        <button
                          type="submit"
                          aria-label={`mint-btn-${denom.display}`}
                          className="btn btn-gradient btn-md grow text-white"
                          disabled={isSigning || !isValid || !dirty}
                        >
                          {isSigning ? (
                            <span className="loading loading-dots loading-xs"></span>
                          ) : (
                            `Mint ${
                              denom.display.startsWith('factory')
                                ? denom.display.split('/').pop()?.toUpperCase()
                                : truncateString(denom.display, 12)
                            }`
                          )}
                        </button>
                      )}
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
