import { cosmos } from '@manifest-network/manifestjs';
import { MsgCancelUpgrade } from '@manifest-network/manifestjs/dist/codegen/cosmos/upgrade/v1beta1/tx';
import { PlanSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/upgrade/v1beta1/upgrade';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { SigningModalDialog } from '@/components';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: string;
  address: string | null;
  plan: PlanSDKType;
}

function InfoItem({ label, value }: { label: string; value?: string | number | bigint }) {
  return (
    <div className="bg-surface-inset p-3 rounded-lg h-full">
      <span className="text-sm text-content-subtle block mb-2">{label}</span>
      <div className="text-sm text-content-muted">{value?.toString() || 'N/A'}</div>
    </div>
  );
}

export function CancelUpgradeModal({ isOpen, onClose, admin, address, plan }: BaseModalProps) {
  const { cancelUpgrade } = cosmos.upgrade.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const queryClient = useQueryClient();
  const handleCancelUpgrade = async () => {
    try {
      const msgUpgrade = cancelUpgrade({
        authority: admin,
      });

      const anyMessage = Any.fromPartial({
        typeUrl: msgUpgrade.typeUrl,
        value: MsgCancelUpgrade.encode(msgUpgrade.value).finish(),
      });

      const groupProposalMsg = submitProposal({
        groupPolicyAddress: admin,
        messages: [anyMessage],
        metadata: '',
        proposers: [address ?? ''],
        title: `Cancel Upgrade`,
        summary: `This proposal will cancel the upgrade`,
        exec: 0,
      });

      await tx([groupProposalMsg], {
        fee: () => estimateFee(address ?? '', [groupProposalMsg]),
        onSuccess: () => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ['currentPlan'] });
        },
      });
    } catch (error) {
      console.error('Error canceling upgrade:', error);
    }
  };

  return (
    <SigningModalDialog
      open={isOpen}
      onClose={onClose}
      style={{ zIndex: 9999 }}
      title="Cancel Upgrade"
    >
      {plan && (
        <div className="space-y-4">
          <h4 className="font-semibold text-content-muted mb-4">Current Upgrade Plan</h4>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Name" value={plan.name} />
            <InfoItem label="Height" value={plan.height} />
            <InfoItem label="Info" value={plan.info} />
            <InfoItem
              label="Time"
              value={plan.time ? new Date(plan.time).toLocaleString() : 'N/A'}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-row justify-center gap-2 w-full">
        <button
          type="button"
          className="btn w-1/2 focus:outline-hidden bg-surface-inset text-base-content"
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn w-1/2 btn-gradient text-white"
          onClick={() => handleCancelUpgrade()}
          disabled={isSigning}
        >
          {isSigning ? <span className="loading loading-dots"></span> : 'Cancel Upgrade'}
        </button>
      </div>
    </SigningModalDialog>
  );
}
