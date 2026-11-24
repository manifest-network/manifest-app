import { Dialog } from '@headlessui/react';
import {
  ProposalSDKType,
  VoteOption,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import React from 'react';

import { CloseIcon } from '@/components/icons';

function VotingPopup({
  open,
  onClose,
  proposal,
}: {
  open: boolean;
  onClose: (vote?: VoteOption) => void;
  proposal: ProposalSDKType;
}) {
  const closeModal = (vote?: number) => {
    onClose(vote);
  };

  if (!proposal) return null;

  return (
    <Dialog
      open={open}
      onClose={() => closeModal()}
      aria-label="vote-modal"
      className="modal modal-open fixed flex p-0 m-0 top-0 right-0 z-9999"
    >
      <div className="fixed inset-0 bg-black/30 " aria-hidden="true" />

      <Dialog.Panel className="modal-box m-auto relative bg-neutral">
        <h3 className="font-bold text-lg mb-4">
          Cast Your Vote for Proposal #{proposal.id.toString()}
        </h3>
        <div className="grid w-full grid-cols-2 gap-4">
          <>
            <button
              onClick={() => closeModal(VoteOption.VOTE_OPTION_YES)}
              className="btn btn-success"
            >
              Yes
            </button>
            <button onClick={() => closeModal(VoteOption.VOTE_OPTION_NO)} className="btn btn-error">
              No
            </button>
            <button
              onClick={() => closeModal(VoteOption.VOTE_OPTION_NO_WITH_VETO)}
              className="btn btn-warning"
            >
              No With Veto
            </button>
            <button
              onClick={() => closeModal(VoteOption.VOTE_OPTION_ABSTAIN)}
              className="btn btn-info"
            >
              Abstain
            </button>
          </>
        </div>
        <div className="modal-action ">
          <button
            className="btn btn-sm absolute top-2 right-2 btn-circle btn-ghost"
            onClick={() => closeModal(undefined)}
          >
            <CloseIcon className="w-2 h-2" />
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default VotingPopup;
