import { cosmos } from '@manifest-network/manifestjs';
import { ThresholdDecisionPolicy } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import { Duration } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/duration';
import { useQueryClient } from '@tanstack/react-query';

import { SignModal } from '@/components/react';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import env from '@/config/env';
import { FormData } from '@/helpers/formReducer';
import { useGroupsByMember } from '@/hooks';
import { useFeeEstimation } from '@/hooks/useFeeEstimation';
import { useTx } from '@/hooks/useTx';
import { secondsToHumanReadable } from '@/utils/string';

export default function ConfirmationForm({
  nextStep,
  prevStep,
  formData,
  address,
}: Readonly<{
  nextStep: () => void;
  prevStep: () => void;
  formData: FormData;
  address: string;
}>) {
  const { createGroupWithPolicy } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const groupMetadata = {
    title: formData.title,
    authors: formData.authors,
    details: formData.description,
    voteOptionContext: '',
  };

  // Convert the object to a JSON string
  let jsonString: string;
  try {
    jsonString = JSON.stringify(groupMetadata);
  } catch (error) {
    console.error('Failed to serialize group metadata:', error);
    throw new Error('Invalid group metadata format');
  }
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const queryClient = useQueryClient();
  const minExecutionPeriod: Duration = {
    seconds: BigInt(0),
    nanos: 0,
  };

  const thresholdMsg = {
    threshold: formData.votingThreshold.toString(), // Convert to string
    windows: {
      votingPeriod: formData.votingPeriod,
      minExecutionPeriod: minExecutionPeriod,
    },
  };

  const threshholdPolicyFromPartial = ThresholdDecisionPolicy.fromPartial(thresholdMsg);

  const threshholdPolicy = ThresholdDecisionPolicy.encode(threshholdPolicyFromPartial).finish();

  const typeUrl = cosmos.group.v1.ThresholdDecisionPolicy.typeUrl;

  const handleConfirm = async () => {
    try {
      const msg = createGroupWithPolicy({
        admin: address ?? '',
        members: formData.members.map(member => ({
          address: member.address,
          weight: '1',
          metadata: member.name,
          added_at: new Date(),
        })),
        groupMetadata: jsonString,
        groupPolicyMetadata: '',
        groupPolicyAsAdmin: true,
        decisionPolicy: {
          threshold: formData.votingThreshold.toString(), // Convert to string
          percentage: formData.votingThreshold.toString(), // Convert to string
          value: threshholdPolicy,
          typeUrl: typeUrl,
        },
      });
      await tx([msg], {
        fee: () => estimateFee(address ?? '', [msg]),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['groupInfoByMember'] });
          nextStep();
        },
      });
    } catch (error) {
      console.error('Error during transaction setup:', error);
    }
  };

  return (
    <section>
      <div className="w-full bg-surface-card p-[24px] rounded-3xl">
        <div className="flex justify-center p-4 rounded-lg mb-6 w-full bg-primary/10 items-center">
          <h1 className="text-xl text-primary font-bold">{formData.title}</h1>
        </div>

        <div className="space-y-6">
          {/* Group Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-content-muted">Group Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-base-300 p-4 rounded-xl">
                <label className="text-sm text-content-muted">Voting period</label>
                <div className="text-content-muted">
                  {secondsToHumanReadable(Number(formData.votingPeriod.seconds))}
                </div>
              </div>
              <div className="bg-base-300  p-4 rounded-xl ">
                <label className="text-sm text-content-muted">Qualified Majority</label>
                <div className="text-content-muted">
                  {formData.votingThreshold} / {formData.members.length}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-base-300 p-4 rounded-xl">
              <label className="text-sm text-content-muted">Description</label>
              <div
                className="overflow-hidden text-ellipsis whitespace-nowrap text-content-muted"
                title={formData.description}
              >
                {formData.description.length > 200
                  ? `${formData.description.slice(0, 200)}...`
                  : formData.description}
              </div>
            </div>
          </div>

          {/* Authors */}
          <div className="max-h-28 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-content-muted">Authors</h2>
            <div className=" grid grid-cols-3 gap-4">
              {Array.isArray(formData.authors) ? (
                formData.authors.map((author, index) => (
                  <div
                    key={index}
                    className="bg-base-300 text-content-muted p-4 rounded-lg flex items-center"
                  >
                    {author.trim().startsWith('manifest1') ? (
                      <TruncatedAddressWithCopy address={author.trim()} />
                    ) : (
                      <span>{author.trim()}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-surface-inset p-4 text-content-muted rounded-lg flex items-center">
                  {formData.authors.trim().startsWith('manifest1') ? (
                    <TruncatedAddressWithCopy address={formData.authors.trim()} />
                  ) : (
                    <span>{formData.authors.trim()}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="max-h-44 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-content-muted">Members</h2>
            <div className="grid grid-cols-3 gap-4">
              {formData.members.map((member, index) => (
                <div key={index} className="bg-base-300 p-4 rounded-lg">
                  <div className="text-sm text-content-muted">Address</div>
                  <TruncatedAddressWithCopy address={member.address} />
                  <div className="text-sm text-content-muted mt-2">Name</div>
                  <div className="text-content-muted">{member.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
      </div>
      <div className="flex gap-6 mt-6 mx-auto w-full">
        <button
          onClick={prevStep}
          className="btn btn-neutral text-base-content  w-[calc(50%-12px)]"
        >
          Back: Group Policy
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSigning || !address}
          className="w-[calc(50%-12px)] btn  btn-gradient text-white "
        >
          {isSigning ? (
            <span className="loading loading-dots loading-sm"></span>
          ) : (
            'Sign Transaction'
          )}
        </button>
      </div>

      <SignModal />
    </section>
  );
}
