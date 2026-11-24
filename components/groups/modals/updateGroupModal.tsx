import { cosmos } from '@manifest-network/manifestjs';
import {
  ThresholdDecisionPolicy,
  ThresholdDecisionPolicySDKType,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { FieldArray, Form, Formik, useFormikContext } from 'formik';
import React from 'react';

import { SigningModalDialog } from '@/components';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { NumberInput, TextArea, TextInput } from '@/components/react/inputs';
import { AddressInput } from '@/components/react/inputs/AddressInput';
import env from '@/config/env';
import { ExtendedGroupType, useFeeEstimation, useTx } from '@/hooks';
import { duration, group as groupSchema } from '@/schemas';
import { secondsToHumanReadable } from '@/utils/string';
import Yup from '@/utils/yupExtensions';

const updateFormSchema = groupSchema.metadataSchema.shape({
  threshold: Yup.number().min(1, 'Threshold must be at least 1').required().default(1),
  votingPeriod: duration.schema
    .required()
    .test(
      'min-total-time',
      () => `Voting period must be at least ${secondsToHumanReadable(env.minimumVotingPeriod)}`,
      value => duration.toSeconds(value) >= env.minimumVotingPeriod
    )
    .default(() => duration.fromSeconds(env.minimumVotingPeriod)),
});

export type UpdateFormValues = Yup.InferType<typeof updateFormSchema>;

/**
 * Default values for the update group form, when the group metadata could not be validated.
 */
const defaultValues: UpdateFormValues = {
  title: 'Unknown Group Title',
  authors: [''],
  details: 'Unknown Group Details',
  threshold: 1,
  votingPeriod: duration.fromSeconds(env.minimumVotingPeriod),
};

export function UpdateGroupModal({
  group,
  policyAddress,
  address,
  onUpdate,
  showUpdateModal,
  setShowUpdateModal,
}: {
  group: ExtendedGroupType;
  policyAddress: string;
  address: string;
  onUpdate: () => void;
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
}) {
  const { tx, isSigning } = useTx(env.chain, 'group-update');
  const { estimateFee } = useFeeEstimation(env.chain);

  let maybeMetadata: groupSchema.GroupMetadata;
  try {
    maybeMetadata = groupSchema.metadataFromJson(group.metadata);
  } catch (e) {
    console.error('Failed to parse group metadata:', e);
    maybeMetadata = defaultValues;
  }

  const title = maybeMetadata.title;
  const initialAuthors = maybeMetadata.authors;
  const details = maybeMetadata.details;

  const maybePolicies = group?.policies?.[0];
  const maybeDecisionPolicy = maybePolicies?.decision_policy;
  const maybeThreshold = (maybeDecisionPolicy as ThresholdDecisionPolicySDKType)?.threshold ?? '';
  const maybeVotingPeriod = (maybeDecisionPolicy as ThresholdDecisionPolicySDKType)?.windows
    ?.voting_period;
  const maybeMembers = group?.members;

  const { updateGroupMetadata, updateGroupPolicyDecisionPolicy, updateGroupPolicyMetadata } =
    cosmos.group.v1.MessageComposer.withTypeUrl;

  const threshold = Number(maybeThreshold || 1);

  // Initialize voting period state from existing data if available
  const votingPeriod = duration.fromSdk(maybeVotingPeriod ?? { seconds: 0n, nanos: 0 });
  const buildMessages = (values: UpdateFormValues) => {
    const messages: Any[] = [];

    // Update Group Metadata
    const authorsDiff = values.authors
      .filter(a => !initialAuthors.includes(a))
      .concat(initialAuthors.filter(a => !values.authors.includes(a)));
    if (title !== values.title || authorsDiff.length > 0 || details !== values.details) {
      const newMetadata = JSON.stringify({
        title: values.title,
        authors: values.authors,
        details: values.details,
      });

      const msgGroupMetadata = updateGroupMetadata({
        admin: group.admin,
        groupId: BigInt(maybeMembers?.[0]?.group_id),
        metadata: newMetadata,
      });
      messages.push(
        Any.fromPartial({
          typeUrl: cosmos.group.v1.MsgUpdateGroupMetadata.typeUrl,
          value: cosmos.group.v1.MsgUpdateGroupMetadata.encode(msgGroupMetadata.value).finish(),
        })
      );

      const msgPolicyMetadata = updateGroupPolicyMetadata({
        groupPolicyAddress: maybePolicies?.address,
        admin: group.admin,
        metadata: newMetadata,
      });
      messages.push(
        Any.fromPartial({
          typeUrl: cosmos.group.v1.MsgUpdateGroupPolicyMetadata.typeUrl,
          value: cosmos.group.v1.MsgUpdateGroupPolicyMetadata.encode(
            msgPolicyMetadata.value
          ).finish(),
        })
      );
    }

    // Update Group Policy Decision Policy
    if (values.threshold !== threshold || duration.compare(values.votingPeriod, votingPeriod)) {
      const thresholdMsg = {
        threshold: (values.threshold || 1).toString(),
        windows: {
          votingPeriod: duration.toSdk(values.votingPeriod),
          minExecutionPeriod: { seconds: BigInt(0), nanos: 0 },
        },
      };

      const thresholdPolicyFromPartial = ThresholdDecisionPolicy.fromPartial(thresholdMsg);
      const thresholdPolicy = ThresholdDecisionPolicy.encode(thresholdPolicyFromPartial).finish();

      const msg = updateGroupPolicyDecisionPolicy({
        groupPolicyAddress: maybePolicies?.address,
        admin: group.admin,
        decisionPolicy: {
          value: thresholdPolicy,
          typeUrl: cosmos.group.v1.ThresholdDecisionPolicy.typeUrl,
        },
      });
      messages.push(
        Any.fromPartial({
          typeUrl: cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy.typeUrl,
          value: cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy.encode(msg.value).finish(),
        })
      );
    }

    return messages;
  };

  async function handleConfirm(values: UpdateFormValues) {
    try {
      const encodedMessages = buildMessages(values);
      if (encodedMessages.length === 0) {
        console.warn('No changes detected.');
        return;
      }
      const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
      const msg = submitProposal({
        groupPolicyAddress: policyAddress,
        proposers: [address],
        metadata: '',
        messages: encodedMessages,
        exec: 0,
        title: 'Update Group',
        summary: 'Update Group',
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          onUpdate();
        },
      });
    } catch (error) {
      console.error('Error in handleConfirm:', error);
    }
  }

  return (
    <SigningModalDialog
      open={showUpdateModal}
      onClose={() => setShowUpdateModal(false)}
      signId="group-update"
    >
      <UpdateGroupForm
        initialValues={{
          title,
          authors: [...initialAuthors],
          details,
          threshold,
          votingPeriod: { ...votingPeriod },
        }}
        onSubmit={handleConfirm}
        setShowUpdateModal={setShowUpdateModal}
        isSigning={isSigning}
      />
    </SigningModalDialog>
  );
}

interface UpdateGroupFormProps {
  initialValues: UpdateFormValues;
  onSubmit: (values: UpdateFormValues) => Promise<void>;
  setShowUpdateModal: React.Dispatch<boolean>;
  isSigning: boolean;
}

/**
 * The update group form itself. Exported for tests.
 *
 * TODO: refactor this to have only the fields it really needs.
 */
export const UpdateGroupForm: React.FC<UpdateGroupFormProps> = ({
  initialValues,
  onSubmit,
  setShowUpdateModal,
  isSigning,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={updateFormSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ isValid, dirty, handleSubmit }) => (
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <GroupDetailsFormFields />
            <GroupPolicyFormFields />
          </div>

          <div className="mt-4 gap-6 flex justify-center w-full">
            <button
              type="button"
              className="btn w-[calc(50%-8px)] btn-md focus:outline-hidden bg-surface-inset"
              disabled={isSigning}
              onClick={() => setShowUpdateModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-label={'upgrade-group-btn'}
              className="btn btn-md w-[calc(50%-8px)] btn-gradient text-white"
              disabled={isSigning || !isValid || !dirty}
              data-testid="update-btn"
            >
              {isSigning ? <span className="loading loading-dots loading-md"></span> : 'Update'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

function GroupPolicyFormFields() {
  const { values, handleChange, touched, errors } = useFormikContext<UpdateFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm mb-1 font-medium text-content-muted">Voting Period</label>
        <div className="grid grid-cols-4 gap-2">
          {['days', 'hours', 'minutes', 'seconds'].map(unit => (
            <NumberInput
              key={unit}
              name={`votingPeriod.${unit}`}
              data-testid={`voting-period-${unit}`}
              placeholder={unit.charAt(0).toUpperCase() + unit.slice(1)}
              label={unit.charAt(0).toUpperCase() + unit.slice(1)}
              onChange={handleChange}
              min={0}
              max={unit === 'days' ? 365 : unit === 'hours' ? 23 : 59}
            />
          ))}
        </div>
        {touched.votingPeriod && typeof errors.votingPeriod == 'string' ? (
          <label className="label">
            <span className="label-text-alt text-error">{errors.votingPeriod}</span>
          </label>
        ) : null}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-content-muted">
          Qualified Majority
        </label>
        <NumberInput
          aria-label={'Qualified Majority'}
          name="threshold"
          placeholder="e.g., 1"
          value={values.threshold}
          onChange={handleChange}
          min={1}
        />
      </div>
    </div>
  );
}

function GroupDetailsFormFields() {
  const { values, handleChange } = useFormikContext<UpdateFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label="Group Title"
        name="title"
        placeholder="Title"
        value={values.title}
        onChange={handleChange}
      />

      <TextArea
        label="Description"
        name="details"
        placeholder="Description"
        value={values.details}
        onChange={handleChange}
      />

      <FieldArray
        name="authors"
        render={arrayHelpers => {
          return (
            <div className="form-control w-full">
              {values.authors.map((_, index) => (
                <div key={index} className="flex mb-2">
                  <AddressInput
                    onChange={handleChange}
                    label={index === 0 ? 'Author name or address' : ''}
                    name={`authors.${index}`}
                    value={values.authors[index]}
                    data-testid={`author-${index}`}
                    rightElement={
                      values.authors.length > 1 &&
                      index !== 0 && (
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          className="btn btn-error btn-sm"
                          data-testid={`remove-author-btn-${index}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => arrayHelpers.push('')}
                className="btn btn-gradient text-white w-full mt-2"
                data-testid="add-author-btn"
              >
                <PlusIcon className="mr-2" /> Add Author
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
