import { TallyResultSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/gov/v1/gov';
import { QueryTallyResultResponseSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/query';
import {
  ProposalSDKType,
  ProposalStatus,
  ThresholdDecisionPolicySDKType,
  proposalStatusToJSON,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import {
  ProposalExecutorResult,
  proposalExecutorResultToJSON,
} from 'cosmjs-types/cosmos/group/v1/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { TimeAgo, TimeAgoMode } from '@/components';
import VoteDetailsModal from '@/components/groups/modals/voteDetailsModal';
import { Pagination } from '@/components/react/Pagination';
import { ExtendedGroupType, useMultipleTallyCounts, useProposalsByPolicyAccount } from '@/hooks';

export function isProposalPassing(tally: TallyResultSDKType | undefined, policyThreshold: number) {
  const yesCount = BigInt(tally?.yes_count ?? '0');
  const noCount = BigInt(tally?.no_count ?? '0');
  const noWithVetoCount = BigInt(tally?.no_with_veto_count ?? '0');
  const abstainCount = BigInt(tally?.abstain_count ?? '0');

  const totalVotes = yesCount + noCount + noWithVetoCount + abstainCount;
  const totalNoVotes = noCount + noWithVetoCount;

  // Check if threshold is reached
  const threshold = BigInt(policyThreshold);
  const isThresholdReached = totalVotes >= threshold;

  // Check for tie
  const isTie = yesCount === totalNoVotes && yesCount > 0;

  // Determine if passing based on vote distribution
  const isPassing = isThresholdReached && yesCount > totalNoVotes;

  return {
    isPassing,
    yesCount,
    noCount,
    noWithVetoCount,
    abstainCount,
    isThresholdReached,
    isTie,
  };
}

function getHumanReadableType(type: string): string {
  const parts = type.split('.');
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace('Msg', '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

export interface GroupProposalsProps {
  group: ExtendedGroupType;
  pageSize?: number;
}

interface ProposalWithTally {
  proposal: ProposalSDKType;
  tally: QueryTallyResultResponseSDKType | undefined;
}

/**
 * GroupProposals component displays a list of proposals for a group in a table.
 * @param group The group to display proposals for.
 * @param proposals The list of proposals to display.
 * @constructor
 */
export const GroupProposals = ({ group, pageSize = 7 }: GroupProposalsProps) => {
  const policyAddress = group?.policies?.[0]?.address ?? '';

  const { proposals, isProposalsLoading, isProposalsError } =
    useProposalsByPolicyAccount(policyAddress);
  const { tallies } = useMultipleTallyCounts(proposals.map(p => p.id));

  // This is O(n^2), even if we don't expect a lot of proposals, let's memoize it.
  const proposalWithTallies: ProposalWithTally[] = React.useMemo(() => {
    return (
      proposals
        // Remove proposals that are rejected or expired.
        .filter(
          // We need to compare strings here
          proposal =>
            proposal.status.toString() !==
              proposalStatusToJSON(ProposalStatus.PROPOSAL_STATUS_REJECTED) &&
            proposal.status.toString() !==
              proposalStatusToJSON(ProposalStatus.PROPOSAL_STATUS_WITHDRAWN)
        )
        .map(proposal => ({
          proposal,
          tally: tallies.find(t => t.proposalId === proposal.id)?.tally,
        }))
    );
  }, [proposals, tallies]);

  if (isProposalsLoading) {
    return (
      <div
        className="flex justify-center items-center h-64"
        role="status"
        aria-label="Loading proposals"
      >
        <span className="loading loading-spinner loading-lg" aria-hidden="true"></span>
      </div>
    );
  } else if (isProposalsError) {
    return (
      <div className="text-center text-error" role="alert">
        Error loading proposals
      </div>
    );
  } else if (proposalWithTallies.length === 0) {
    return (
      <div className="text-center py-8 text-content-muted" role="status">
        No proposal was found.
      </div>
    );
  }

  return <ProposalTable group={group} pageSize={pageSize} proposals={proposalWithTallies} />;
};

interface ProposalTableProps {
  group: ExtendedGroupType;
  pageSize: number;
  proposals: ProposalWithTally[];
}

function ProposalTable({ group, pageSize, proposals }: ProposalTableProps) {
  const [defaultPage, setDefaultPage] = useState(0);
  const router = useRouter();

  // Check if we're supposed to show a proposal, then go to its page.
  useEffect(() => {
    const { proposalId } = router.query;
    const maybeProposalIndex = proposals.findIndex(
      ({ proposal }) => proposal.id.toString() === proposalId
    );

    if (maybeProposalIndex >= 0) {
      setDefaultPage(Math.floor(maybeProposalIndex / pageSize));
    }
  }, [pageSize, proposals, router.query]);

  return (
    <Pagination dataset={proposals} pageSize={pageSize} selectedPage={defaultPage}>
      <table
        className="table w-full border-separate border-spacing-y-3 -mt-6"
        aria-label="Group proposals"
        data-testid="proposals"
      >
        <thead>
          <tr className="text-sm font-medium">
            <th className="bg-transparent px-4 py-2 w-[25%]" scope="col">
              ID
            </th>
            <th className="bg-transparent px-4 py-2 w-[25%]" scope="col">
              Title
            </th>
            <th className="bg-transparent px-4 py-2 w-[25%] hidden xl:table-cell" scope="col">
              Time Left
            </th>
            <th
              className="bg-transparent px-4 py-2 w-[25%] sm:table-cell md:hidden hidden xl:table-cell"
              scope="col"
            >
              Type
            </th>
            <th
              className="bg-transparent px-4 py-2 w-[25%] sm:table-cell xxs:hidden hidden 2xl:table-cell"
              scope="col"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="space-y-4">
          <Pagination.Data.Consumer>
            {rows =>
              rows.map(({ proposal, tally }) => (
                <ProposalRow
                  key={`proposal-${proposal.id}`}
                  group={group}
                  proposal={proposal}
                  tally={tally}
                />
              ))
            }
          </Pagination.Data.Consumer>
        </tbody>
      </table>
    </Pagination>
  );
}

const ProposalRow = ({
  group,
  proposal,
  tally,
}: {
  group?: ExtendedGroupType;
  proposal: ProposalSDKType;
  tally?: QueryTallyResultResponseSDKType;
}) => {
  const [showVoteModal, setShowVoteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { proposalId } = router.query;
    if (proposalId === proposal.id.toString()) {
      setShowVoteModal(true);
    }
  }, [router.query, proposal]);

  const policyAddress = group?.policies[0]?.address ?? '';
  const policyThreshold =
    (group?.policies[0]?.decision_policy as ThresholdDecisionPolicySDKType)?.threshold ?? '0';

  const endTime = new Date(proposal?.voting_period_end);

  let status = 'Pending';
  // We need to compare strings here
  if (
    proposal.executor_result.toString() ===
    proposalExecutorResultToJSON(ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_FAILURE)
  ) {
    status = 'Failure';
  } else if (
    proposal.status.toString() === proposalStatusToJSON(ProposalStatus.PROPOSAL_STATUS_ACCEPTED)
  ) {
    status = 'Execute';
  } else if (tally) {
    const { isPassing, isThresholdReached, isTie } = isProposalPassing(
      tally?.tally,
      Number.parseInt(policyThreshold) || 0
    );
    if (isThresholdReached) {
      if (isTie) {
        status = 'Tie';
      } else {
        status = isPassing ? 'Passing' : 'Failing';
      }
    }
  }

  return (
    <>
      <tr
        key={proposal.id.toString()}
        onClick={() => {
          setShowVoteModal(true);
          // Update URL without navigating
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, proposalId: proposal.id.toString() },
            },
            undefined,
            {
              shallow: true,
            }
          );
        }}
        className="group text-base-content rounded-lg cursor-pointer"
      >
        <td className="bg-secondary group-hover:bg-base-300 rounded-l-xl px-4 py-4 w-[25%]">
          {proposal.id.toString()}
        </td>
        <td
          className={`bg-secondary group-hover:bg-base-300 px-4 py-4 w-[25%] sm:rounded-none xxs:rounded-r-xl xs:rounded-r-xl xl:rounded-r-none`}
        >
          {proposal.title}
        </td>
        <td className="bg-secondary group-hover:bg-base-300 px-4 py-4 w-[25%] hidden xl:table-cell">
          <TimeAgo datetime={endTime} mode={TimeAgoMode.FutureOnly} />
        </td>
        <td className="bg-secondary group-hover:bg-base-300 px-4 py-4 w-[25%] sm:table-cell md:hidden hidden xl:table-cell ">
          {proposal.messages.length > 0
            ? getHumanReadableType((proposal.messages[0] as any)['@type'])
            : 'No messages'}
        </td>
        <td className="bg-secondary group-hover:bg-base-300 rounded-r-xl sm:table-cell xxs:hidden hidden 2xl:table-cell">
          {!tally ? <span className="loading loading-spinner loading-xs"></span> : status}

          {
            // Show vote modal if the proposal is selected, cannot be outside `<tr>`.
            showVoteModal && (
              <VoteDetailsModal
                policyAddress={policyAddress}
                proposalId={proposal.id}
                onClose={() => {
                  setShowVoteModal(false);
                  const { proposalId: _, ...query } = router.query;
                  router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
                }}
                showVoteModal={showVoteModal}
              />
            )
          }
        </td>
      </tr>
    </>
  );
};
