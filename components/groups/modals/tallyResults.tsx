import { Dialog } from '@headlessui/react';
import { VoteSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import React from 'react';

import { getVoteOptionBadgeColor, getVoteOptionLabel } from '@/components/groups/utils';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';

export function TallyResults({
  votes,
  opened,
  onClose,
}: {
  votes: VoteSDKType[];
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={opened}
      onClose={onClose}
      className="modal modal-open fixed flex p-0 m-0 top-0 right-0 z-9999"
    >
      <Dialog.Panel
        className="modal-box max-w-4xl m-auto bg-secondary"
        aria-label="proposal-messages-dialog"
      >
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Tally Results</h3>
        <div className="mt-6">
          <div className="grid grid-cols-[70%_30%] gap-4 font-semibold text-content-muted mb-2">
            <div>Voter Address</div>
            <div>Vote Option</div>
          </div>
          <div className="grid grid-cols-[70%_30%] gap-4">
            {votes.map((vote, index) => (
              <React.Fragment key={index}>
                <div>
                  <TruncatedAddressWithCopy address={vote.voter} />
                </div>
                <div>
                  <span
                    className={`badge badge-lg rounded-full ${getVoteOptionBadgeColor(vote.option)}`}
                  >
                    {getVoteOptionLabel(vote.option)}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
