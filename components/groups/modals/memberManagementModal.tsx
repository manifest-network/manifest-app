import { cosmos } from '@manifest-network/manifestjs';
import { MemberSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { Field, FieldProps, Form, Formik } from 'formik';
import React, { useRef, useState } from 'react';
import * as Yup from 'yup';

import { AddressCopyButton, SigningModalDialog } from '@/components';
import { TrashIcon } from '@/components/icons';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { truncateAddress } from '@/utils';

interface ExtendedMember extends MemberSDKType {
  isNew: boolean;
  markedForDeletion: boolean;
}

interface MemberManagementModalProps {
  members: MemberSDKType[];
  groupId: string;
  groupAdmin: string;
  policyAddress: string;
  address: string;
  onUpdate: () => void;
  setShowMemberManagementModal: (show: boolean) => void;
  showMemberManagementModal: boolean;
}

export function MemberManagementModal({
  members: initialMembers,
  groupId,
  groupAdmin,
  policyAddress,
  address,
  onUpdate,
  setShowMemberManagementModal,
  showMemberManagementModal,
}: MemberManagementModalProps) {
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);

  const validationSchema = Yup.object().shape({
    members: Yup.array().of(
      Yup.object().shape({
        address: Yup.string().required('Address is required').manifestAddress(),
        metadata: Yup.string()
          .noProfanity('Profanity is not allowed')
          .required('Required')
          .max(25, 'Maximum 25 characters'),
      })
    ),
  });

  const [members, setMembers] = useState<ExtendedMember[]>(() =>
    initialMembers.map(member => ({
      ...member,
      isNew: false,
      markedForDeletion: false,
      weight: member.weight || '1',
    }))
  );

  const handleMemberToggleDeletion = (index: number) => {
    const formValues = formikRef.current?.values?.members || [];

    setMembers(prevMembers => {
      const newMembers = [...prevMembers];
      const member = newMembers[index];

      if (member.isNew) {
        // Remove just this new member
        newMembers.splice(index, 1);
      } else {
        // Toggle deletion for existing member
        newMembers[index] = {
          ...member,
          markedForDeletion: !member.markedForDeletion,
        };
      }

      // Preserve form values for all members
      return newMembers.map((m, idx) => ({
        ...m,
        metadata: formValues[idx]?.metadata || m.metadata,
        address: formValues[idx]?.address || m.address,
      }));
    });
  };

  const handleAddMember = () => {
    const formValues = formikRef.current?.values?.members || [];

    setMembers(prevMembers => {
      const newMember: ExtendedMember = {
        address: '',
        metadata: '',
        weight: '1',
        isNew: true,
        added_at: new Date(),
        markedForDeletion: false,
      };

      const newMembers = [...prevMembers, newMember];

      // Preserve form values for all existing members
      return newMembers.map((m, idx) => ({
        ...m,
        metadata: formValues[idx]?.metadata || m.metadata,
        address: formValues[idx]?.address || m.address,
      }));
    });
  };

  const buildMessages = (formMembers: ExtendedMember[]) => {
    const messages: Any[] = [];
    const { updateGroupMembers } = cosmos.group.v1.MessageComposer.withTypeUrl;

    // Filter out new members with empty fields
    const memberUpdates = formMembers
      .filter(member => !member.isNew || (member.address && member.metadata))
      .map(member => ({
        address: member.address,
        metadata: member.metadata,
        weight: member.markedForDeletion ? '0' : member.weight || '1',
      }));

    const msg = updateGroupMembers({
      admin: groupAdmin,
      groupId: BigInt(groupId),
      memberUpdates,
    });

    messages.push(
      Any.fromPartial({
        typeUrl: cosmos.group.v1.MsgUpdateGroupMembers.typeUrl,
        value: cosmos.group.v1.MsgUpdateGroupMembers.encode(msg.value).finish(),
      })
    );

    return messages;
  };

  const handleConfirm = async (values: { members: ExtendedMember[] }) => {
    try {
      const encodedMessages = buildMessages(values.members);
      const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
      const msg = submitProposal({
        groupPolicyAddress: policyAddress,
        proposers: [address],
        metadata: '',
        messages: encodedMessages,
        exec: 0,
        title: 'Update Group Members',
        summary: 'Update Group Members',
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          onUpdate();
        },
      });
    } catch (error) {
      console.error('Error submitting proposal:', error);
    }
  };

  const submitFormRef = useRef<(() => void) | null>(null);
  const formikRef = useRef<any>(null);

  if (!showMemberManagementModal) {
    return null;
  }

  return (
    <SigningModalDialog open onClose={() => setShowMemberManagementModal(false)}>
      <div className="flex justify-between items-center my-8">
        <h3 className="text-2xl font-semibold">Members</h3>
        <button
          type="button"
          className="btn btn-gradient xs:max-3xl:w-[140px] xxs:w-auto h-[52px] text-white btn-sm"
          disabled={isSigning}
          onClick={handleAddMember}
        >
          New member
        </button>
      </div>

      <Formik
        innerRef={formikRef}
        initialValues={{ members }}
        validationSchema={validationSchema}
        onSubmit={handleConfirm}
        enableReinitialize={true}
      >
        {({ values, isValid, setFieldValue, handleSubmit, touched }) => {
          submitFormRef.current = handleSubmit;

          return (
            <>
              <Form>
                <div className="flex items-center mb-4 px-4 text-sm text-content-muted">
                  <div className="w-[10%] ml-3">#</div>
                  <div className="w-[35%] ml-11">Name</div>
                  <div className="w-[45%]">Address</div>
                  <div className="w-[10%]"></div>
                </div>
                <div className="space-y-4 max-h-[22rem] overflow-y-auto">
                  {values.members.map((member, index) => (
                    <div
                      key={index}
                      className={`flex items-center bg-surface-inset rounded-xl p-3 ${
                        member.markedForDeletion ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="w-[10%] text-center">{index + 1}</div>
                      {/* Name Field with Daisy UI Tooltip */}
                      <div className="w-[35%] ml-12 pr-6 relative">
                        <Field name={`members.${index}.metadata`}>
                          {({ field, meta }: FieldProps) => (
                            <div>
                              <input
                                {...field}
                                type="text"
                                className={`input input-sm focus:outline-hidden input-ghost  bg-transparent w-full max-w-xs  ${
                                  meta.touched && meta.error ? 'input-error' : ''
                                }`}
                                placeholder="member name"
                                disabled={member.markedForDeletion}
                              />
                              {meta.touched && meta.error && (
                                <div
                                  className="tooltip tooltip-bottom tooltip-open tooltip-primary text-white text-xs mt-1 absolute left-1/2 transform translate-y-7 -translate-x-4 z-50"
                                  data-tip={meta.error}
                                >
                                  {/* Invisible element to anchor the tooltip */}
                                  <div className="w-0 h-0"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </Field>
                      </div>
                      {/* Address Field with Daisy UI Tooltip */}
                      <div className="w-[45%] flex items-center relative">
                        <Field name={`members.${index}.address`}>
                          {({ field, meta }: FieldProps) => (
                            <div className="grow relative">
                              <AddressInput
                                {...field}
                                className={`input input-sm focus:outline-hidden disabled:bg-transparent disabled:border-none bg-transparent input-ghost w-full ${
                                  meta.touched && meta.error ? 'input-error' : ''
                                }`}
                                placeholder="manifest1..."
                                disabled={!member.isNew || member.markedForDeletion}
                                value={truncateAddress(field.value)}
                                small
                                data-1p-ignore
                              />
                              {meta.touched && meta.error && (
                                <div
                                  className="tooltip tooltip-bottom tooltip-open tooltip-primary text-white text-xs mt-1 absolute left-1/2 transform translate-y-7 -translate-x-4 z-50"
                                  data-tip={meta.error}
                                >
                                  <div className="w-0 h-0"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </Field>

                        <AddressCopyButton
                          address={member.address}
                          className="btn btn-ghost hover:bg-transparent btn-sm"
                        />
                      </div>
                      <div className="w-[10%] flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleMemberToggleDeletion(index)}
                          className={`btn btn-primary btn-square btn-sm`}
                        >
                          <TrashIcon className="text-white w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 gap-6 flex justify-center w-full">
                  <button
                    type="button"
                    className="btn w-[calc(50%-8px)] btn-md focus:outline-hidden bg-surface-inset"
                    disabled={isSigning}
                    onClick={() => setShowMemberManagementModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-md w-[calc(50%-8px)] btn-gradient  text-white"
                    onClick={() => submitFormRef.current?.()}
                    disabled={isSigning || !isValid || !touched}
                  >
                    {isSigning ? <span className="loading loading-dots loading-md"></span> : 'Save'}
                  </button>
                </div>
              </Form>
            </>
          );
        }}
      </Formik>
    </SigningModalDialog>
  );
}
