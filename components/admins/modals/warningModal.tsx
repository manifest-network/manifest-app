import { useChain } from '@cosmos-kit/react';
import { cosmos, strangelove_ventures } from '@manifest-network/manifestjs';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { MsgRemoveValidator } from '@manifest-network/manifestjs/dist/codegen/strangelove_ventures/poa/v1/tx';
import React from 'react';
import { PiWarning } from 'react-icons/pi';

import { SigningModalDialog } from '@/components';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';

interface WarningModalProps {
  admin: string;
  isActive: boolean;
  address: string;
  moniker: string;
  modalId: string;
  openWarningModal: boolean;
  setOpenWarningModal: (open: boolean) => void;
}

export function WarningModal({
  admin,
  moniker,
  modalId,
  address,
  isActive,
  openWarningModal,
  setOpenWarningModal,
}: Readonly<WarningModalProps>) {
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { address: userAddress } = useChain(env.chain);
  const { removePending, removeValidator } =
    strangelove_ventures.poa.v1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;

  const handleAccept = async () => {
    const msgRemoveActive = removeValidator({
      sender: admin ?? '',
      validatorAddress: address,
    });

    const msgRemovePending = removePending({
      sender: admin ?? '',
      validatorAddress: address,
    });

    const anyMessage = Any.fromPartial({
      typeUrl: isActive ? msgRemoveActive.typeUrl : msgRemovePending.typeUrl,
      value: isActive
        ? MsgRemoveValidator.encode(msgRemoveActive.value).finish()
        : MsgRemoveValidator.encode(msgRemovePending.value).finish(),
    });

    const groupProposalMsg = submitProposal({
      groupPolicyAddress: admin,
      messages: [anyMessage],
      metadata: '',
      proposers: [userAddress ?? ''],
      title: `Remove ${isActive ? 'Active' : 'Pending'} Validator ${moniker}`,
      summary: `Proposal to remove ${moniker} from the ${isActive ? 'active' : 'pending'} set.`,
      exec: 0,
    });

    await tx([groupProposalMsg], {
      fee: () => estimateFee(userAddress ?? '', [groupProposalMsg]),
      onSuccess: () => {},
    });
  };

  const handleClose = () => setOpenWarningModal(false);

  return (
    <SigningModalDialog open={openWarningModal} onClose={handleClose}>
      <form method="dialog">
        <div className="p-4">
          <div className="flex flex-col gap-2 items-center mb-6">
            <PiWarning className="text-warning text-6xl" />
          </div>
          <p className="text-md text-center font-thin">
            Are you sure you want to remove the validator{' '}
          </p>
          <p className="text-center font-bold text-2xl mt-2">{moniker}</p>
          <p className="text-md text-center font-thin mt-2">
            from the {isActive ? 'active set' : 'pending list'}?
          </p>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-error w-1/2 mx-auto -mt-2"
            onClick={handleAccept}
            disabled={isSigning}
          >
            {isSigning ? (
              <span className="loading loading-dots loading-sm"></span>
            ) : isActive ? (
              'Remove From Active Set'
            ) : (
              'Remove From Pending List'
            )}
          </button>
        </div>
      </form>
    </SigningModalDialog>
  );
}
