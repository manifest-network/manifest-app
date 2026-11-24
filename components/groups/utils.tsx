import {
  ProposalExecutorResult,
  ProposalSDKType,
  ProposalStatus,
  VoteOption,
  proposalExecutorResultFromJSON,
  proposalStatusFromJSON,
  voteOptionFromJSON,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import React from 'react';

export function getProposalButton(
  proposal: ProposalSDKType,
  address: string | undefined,
  executeWithdrawal: () => void,
  executeProposal: () => void,
  setShowVotingPopup: (value: boolean) => void,
  isSigning: boolean,
  pollForData: boolean,
  userVoteOption?: VoteOption | undefined
): React.ReactNode | undefined {
  const isProposer = proposal.proposers.includes(address || '');
  switch (proposalExecutorResultFromJSON(proposal.executor_result)) {
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_NOT_RUN:
      switch (proposalStatusFromJSON(proposal.status)) {
        case ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED:
        case ProposalStatus.PROPOSAL_STATUS_REJECTED:
        case ProposalStatus.PROPOSAL_STATUS_ABORTED:
        case ProposalStatus.PROPOSAL_STATUS_WITHDRAWN:
        default:
          return undefined;
        case ProposalStatus.PROPOSAL_STATUS_SUBMITTED:
          return (
            <div className="flex flex-row items-stretch justify-center gap-2">
              {pollForData ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-secondary-content">The proposal is getting processed.</div>
                  <div className="flex flex-row items-center justify-center gap-2">
                    <div className="text-secondary-content">Please wait</div>
                    <div className="loading loading-dots loading-sm" />
                  </div>
                </div>
              ) : (
                <>
                  {isProposer && (
                    <button
                      className={`btn btn-error w-1/2`}
                      disabled={isSigning}
                      onClick={executeWithdrawal}
                    >
                      {isSigning ? <div className="loading loading-dots loading-sm" /> : 'Withdraw'}
                    </button>
                  )}
                  {!userVoteOption ? (
                    <button
                      className={`btn btn-gradient text-white ${isProposer ? 'w-1/2' : 'w-full'}`}
                      disabled={isSigning}
                      onClick={() => setShowVotingPopup(true)}
                    >
                      {isSigning ? <div className="loading loading-dots loading-sm" /> : 'Vote'}
                    </button>
                  ) : (
                    <div
                      className={`flex min-h-12 items-center justify-center text-white rounded-xl px-3 py-1 font-semibold ${isProposer ? 'w-1/2' : 'w-full'} ${getVoteOptionBadgeColor(userVoteOption)}`}
                    >
                      You voted {userVoteOption ? getVoteOptionLabel(userVoteOption) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        case ProposalStatus.PROPOSAL_STATUS_ACCEPTED:
          return (
            <button
              className="btn btn-gradient text-white w-full"
              disabled={isSigning}
              onClick={executeProposal}
            >
              {isSigning ? <div className="loading loading-dots loading-sm" /> : 'Execute'}
            </button>
          );
      }
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_FAILURE:
      return (
        <button
          className="btn w-full btn-gradient text-white "
          disabled={isSigning}
          onClick={executeProposal}
        >
          {isSigning ? <div className="loading loading-dots loading-sm" /> : 'Re-execute'}
        </button>
      );
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_SUCCESS:
    default:
      return undefined;
  }
}

export function getProposalStatusLabel(proposal: ProposalSDKType): string {
  switch (proposalExecutorResultFromJSON(proposal.executor_result)) {
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_NOT_RUN:
      switch (proposalStatusFromJSON(proposal.status)) {
        case ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED:
          return 'unspecified';
        case ProposalStatus.PROPOSAL_STATUS_SUBMITTED:
          return 'voting';
        case ProposalStatus.PROPOSAL_STATUS_ACCEPTED:
          return 'accepted';
        case ProposalStatus.PROPOSAL_STATUS_WITHDRAWN:
          return 'withdrawn';
        case ProposalStatus.PROPOSAL_STATUS_REJECTED:
          return 'rejected';
        case ProposalStatus.PROPOSAL_STATUS_ABORTED:
          return 'aborted';
        default:
          return 'unknown';
      }
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_SUCCESS:
      return 'success';
    case ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_FAILURE:
      return 'failure';
    default:
      return 'unknown';
  }
}

export function getVoteOptionLabel(option: VoteOption): string {
  switch (voteOptionFromJSON(option)) {
    case VoteOption.VOTE_OPTION_UNSPECIFIED:
      return 'unspecified';
    case VoteOption.VOTE_OPTION_YES:
      return 'yes';
    case VoteOption.VOTE_OPTION_NO:
      return 'no';
    case VoteOption.VOTE_OPTION_ABSTAIN:
      return 'abstain';
    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      return 'veto';
    case VoteOption.UNRECOGNIZED:
    default:
      return 'unknown';
  }
}

export function getVoteOptionBadgeColor(option?: VoteOption): string {
  switch (voteOptionFromJSON(option)) {
    case VoteOption.VOTE_OPTION_YES:
      return 'bg-success';
    case VoteOption.VOTE_OPTION_NO:
      return 'bg-error';
    case VoteOption.VOTE_OPTION_ABSTAIN:
      return 'bg-info';
    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      return 'bg-warning';
    case VoteOption.UNRECOGNIZED:
    case VoteOption.VOTE_OPTION_UNSPECIFIED:
    default:
      return 'bg-content-subtle';
  }
}
