import { useChain } from '@cosmos-kit/react';
import { cosmos, strangelove_ventures } from '@manifest-network/manifestjs';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { MsgSetPower } from '@manifest-network/manifestjs/dist/codegen/strangelove_ventures/poa/v1/tx';
import { Field, FieldProps, Formik } from 'formik';
import Image from 'next/image';
import React, { useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import * as Yup from 'yup';

import { ExtendedValidatorSDKType, SigningModalDialog } from '@/components';
import { TextInput } from '@/components/react';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { ProfileAvatar } from '@/utils/identicon';
import { calculateIsUnsafe } from '@/utils/maths';

import { DescriptionModal } from './descriptionModal';

const PowerUpdateSchema = Yup.object().shape({
  power: Yup.number()
    .typeError('Power must be a number')
    .required('Power is required')
    .min(1, 'Power must be greater than 0')
    .integer('Power must be an integer'),
});

export function ValidatorDetailsModal({
  validator,
  admin,
  totalvp,
  validatorVPArray,
  openValidatorModal,
  setOpenValidatorModal,
  hasUnbounding,
}: Readonly<{
  validator: ExtendedValidatorSDKType | null;
  admin: string;
  totalvp: string;
  validatorVPArray: { vp: bigint; moniker: string }[];
  openValidatorModal: boolean;
  setOpenValidatorModal: (open: boolean) => void;
  hasUnbounding: boolean;
}>) {
  const [description, setDescription] = useState<string | undefined>(undefined);

  const [power, setPowerInput] = useState(validator?.consensus_power?.toString() || '');

  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { address: userAddress } = useChain(env.chain);

  const { setPower } = strangelove_ventures.poa.v1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const isUnsafe = React.useMemo(() => {
    return calculateIsUnsafe(power, validator?.consensus_power?.toString() || '', totalvp);
  }, [power, validator?.consensus_power, totalvp]);

  const unbondingTimeDate = React.useMemo(() => {
    const d = validator?.unbonding_time ? new Date(validator.unbonding_time) : undefined;
    return d && d.getTime() === 0 ? undefined : d;
  }, [validator?.unbonding_time]);

  const unbondingTimeText = React.useMemo(() => {
    if (!unbondingTimeDate) return '';
    return unbondingTimeDate.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }, [unbondingTimeDate]);

  if (!validator) return null;

  const isEmail = (contact: string | undefined): boolean => {
    if (!contact) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(contact);
  };

  const handleUpdate = async (values: { power: string }) => {
    // The minimum power is 1_000_000
    const realPower = BigInt(values.power) * BigInt(10 ** 6);
    const msgSetPower = setPower({
      sender: admin ?? '',
      validatorAddress: validator.operator_address,
      power: realPower,
      unsafe: isUnsafe,
    });

    const anyMessage = Any.fromPartial({
      typeUrl: msgSetPower.typeUrl,
      value: MsgSetPower.encode(msgSetPower.value).finish(),
    });

    const groupProposalMsg = submitProposal({
      groupPolicyAddress: admin,
      messages: [anyMessage],
      metadata: '',
      proposers: [userAddress ?? ''],
      title: `Update the Voting Power of ${validator.description.moniker}`,
      summary: `This proposal will update the voting power of ${validator.description.moniker} to ${values.power}`,
      exec: 0,
    });

    await tx([groupProposalMsg], {
      fee: () => estimateFee(userAddress ?? '', [groupProposalMsg]),
      onSuccess: () => {},
    });
  };

  return (
    <SigningModalDialog
      panelClassName="max-w-3xl"
      open={openValidatorModal}
      onClose={() => setOpenValidatorModal(false)}
    >
      <Formik
        initialValues={{ power: power, totalvp, validatorVPArray }}
        validationSchema={PowerUpdateSchema}
        onSubmit={() => {}}
        enableReinitialize
      >
        {({ isValid }) => (
          <>
            <div className="flex flex-col grow w-full space-y-6">
              <h3 className="text-2xl font-bold text-black dark:text-white">Validator Details</h3>
              <div className="flex flex-col justify-start items-start gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">VALIDATOR</span>
                <div className="flex flex-row justify-start items-center gap-4">
                  {validator?.logo_url && (
                    <Image
                      className="h-16 w-16 rounded-full"
                      src={validator.logo_url}
                      alt=""
                      width={64}
                      height={64}
                    />
                  )}
                  {!validator?.logo_url && (
                    <ProfileAvatar walletAddress={validator?.operator_address} size={64} />
                  )}

                  <span className="text-2xl font-bold text-black dark:text-white">
                    {validator?.description.moniker}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-[12px] p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">SECURITY CONTACT</span>
                  <p className="text-md text-black dark:text-white mt-2">
                    {isEmail(validator?.description.security_contact)
                      ? validator?.description.security_contact
                      : 'No Security Contact'}
                  </p>
                </div>
                {!unbondingTimeDate && (
                  <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-[12px] p-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">POWER</span>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex flex-row gap-2 justify-between items-center">
                        <div className="relative w-2/3">
                          <Field name="power">
                            {({ field, meta }: FieldProps) => (
                              <div className="relative">
                                <TextInput
                                  showError={false}
                                  {...field}
                                  type="number"
                                  placeholder={validator?.consensus_power?.toString() ?? 'Inactive'}
                                  className={`input input-bordered w-full ${
                                    meta.touched && meta.error ? 'input-error' : ''
                                  }`}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    field.onChange(e);
                                    setPowerInput(e.target.value);
                                  }}
                                />
                                {meta.touched && meta.error && (
                                  <div
                                    className="tooltip tooltip-bottom tooltip-open tooltip-error bottom-0 absolute left-1/2 transform -translate-x-1/2 translate-y-full mt-1 z-50 text-white text-xs"
                                    data-tip={meta.error}
                                  >
                                    <div className="w-0 h-0"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-gradient w-1/3"
                          disabled={!isValid || isSigning || hasUnbounding}
                          onClick={() => {
                            handleUpdate({ power: power });
                          }}
                        >
                          {isSigning ? (
                            <span className="loading loading-dots loading-sm"></span>
                          ) : (
                            'Update'
                          )}
                        </button>
                      </div>
                      {hasUnbounding && (
                        <div className="alert alert-warning mt-2" role="alert" aria-live="polite">
                          <span>
                            You cannot update validator power while validator(s) are unbonding.
                          </span>
                        </div>
                      )}
                      {isUnsafe && Number(power) > 0 && (
                        <div className="text-warning text-xs">
                          Warning: This power update may be unsafe
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {unbondingTimeDate && (
                  <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-[12px] p-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      UNBONDING TIME (UTC)
                    </span>
                    <p className="text-md text-black dark:text-white mt-2">{unbondingTimeText}</p>
                  </div>
                )}
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-[12px] p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">OPERATOR ADDRESS</span>
                  <div className="text-md mt-2">
                    <TruncatedAddressWithCopy address={validator?.operator_address} />
                  </div>
                </div>
                <div className="dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-[12px] p-4">
                  <div className="flex flex-row justify-between items-center relative">
                    <span className="text-sm text-gray-500 dark:text-gray-400">DETAILS</span>
                    {validator?.description.details.length > 50 && (
                      <button
                        className="btn btn-sm btn-ghost hover:bg-transparent absolute -right-2 -top-2"
                        onClick={() =>
                          setDescription(validator?.description.details ?? 'No Details')
                        }
                      >
                        <BsThreeDots />
                      </button>
                    )}
                  </div>
                  <p className="text-md mt-2 text-black dark:text-white" aria-label="details">
                    {validator?.description.details
                      ? validator.description.details.substring(0, 50) +
                        (validator.description.details.length > 50 ? '...' : '')
                      : 'No Details'}
                  </p>
                </div>
              </div>
            </div>
            <DescriptionModal
              type="validator"
              open={description !== undefined}
              onClose={() => setDescription(undefined)}
              details={validator?.description.details ?? 'No Details'}
            />
          </>
        )}
      </Formik>
    </SigningModalDialog>
  );
}
