import { cosmos } from '@manifest-network/manifestjs';
import { ThresholdDecisionPolicySDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import React, { useState } from 'react';

import { SigningModalDialog, UpdateGroupModal } from '@/components';
import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import env from '@/config/env';
import { useFeeEstimation, useTx } from '@/hooks';
import { ExtendedGroupType } from '@/hooks/useQueries';
import { ProfileAvatar } from '@/utils/identicon';

interface GroupInfoProps {
  group: ExtendedGroupType | null;
  policyAddress: string;
  address: string;
  onUpdate: () => void;
  showInfoModal: boolean;
  setShowInfoModal: (show: boolean) => void;
}

export function GroupInfo({
  group,
  policyAddress,
  address,
  onUpdate,
  showInfoModal,
  setShowInfoModal,
}: GroupInfoProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { tx, isSigning } = useTx(env.chain);
  const { leaveGroup } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const { estimateFee } = useFeeEstimation(env.chain);
  if (!group || !group.policies || group.policies.length === 0) return null;

  const policy = group.policies[0];
  const votingPeriod = (group.policies[0]?.decision_policy as ThresholdDecisionPolicySDKType)
    ?.windows?.voting_period;
  const votingPeriodSeconds = (() => {
    try {
      if (!votingPeriod) return 0;
      const seconds = Number(votingPeriod.toString().replace('s', ''));
      if (isNaN(seconds) || seconds < 0) return 0;
      return seconds;
    } catch (error) {
      console.error('Error parsing voting period:', error);
      return 0;
    }
  })();

  const votingPeriodDisplay = (() => {
    try {
      if (votingPeriodSeconds === 0) return 'No voting period';

      if (votingPeriodSeconds >= 86400) {
        const days = Math.floor(votingPeriodSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      if (votingPeriodSeconds >= 3600) {
        const hours = Math.floor(votingPeriodSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      const minutes = Math.max(1, Math.floor(votingPeriodSeconds / 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error calculating voting period display:', error);
      return 'Invalid voting period';
    }
  })();

  const threshold =
    (policy?.decision_policy as ThresholdDecisionPolicySDKType)?.threshold ??
    'No threshold available';

  function renderAuthors() {
    let metadata = null;
    let authors: string | string[] = 'No authors available';

    try {
      metadata = group?.metadata ? JSON.parse(group.metadata) : null;
      authors =
        metadata?.authors && metadata.authors.length > 0
          ? metadata.authors
          : 'No authors available';
    } catch (e) {
      // console.warn('Failed to parse group metadata for authors:', e);
    }

    if (!authors) {
      return <InfoItem label="Author" value="No author information" />;
    }

    try {
      const formatAddress = (author: string, index: number) => (
        <InfoItem key={index} label="Address" value={author} isAddress={true} />
      );

      const formatAuthor = (author: string, index: number) => (
        <InfoItem key={index} label={`Author ${index + 1}`} value={author} />
      );

      if (typeof authors === 'string') {
        if (authors.startsWith('manifest1')) {
          return <div className="grid grid-cols-2 gap-4">{formatAddress(authors, 0)}</div>;
        }
        return formatAuthor(authors, 0);
      }

      if (Array.isArray(authors)) {
        const manifestAddresses = authors.filter(
          (author): author is string => typeof author === 'string' && author.startsWith('manifest1')
        );

        if (manifestAddresses.length > 0) {
          return (
            <div className="grid grid-cols-2 gap-4">
              {manifestAddresses.map((author, index) => formatAddress(author, index))}
            </div>
          );
        }

        return <div>{authors.map((author, index) => formatAuthor(String(author), index))}</div>;
      }
    } catch (e) {
      console.warn('Failed to process authors data:', e);
    }

    return <InfoItem label="Author" value="Invalid author information" />;
  }

  const handleLeave = async () => {
    try {
      const msg = leaveGroup({
        address: address,
        groupId: group?.id,
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          onUpdate();
          setShowInfoModal(false);
        },
      });
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  let title = 'Untitled Group';
  let details = 'No description';

  try {
    const metadata = group.metadata ? JSON.parse(group.metadata) : null;
    title = metadata?.title || 'Untitled Group';
    details = metadata?.details || 'No description';
  } catch (e) {
    // console.warn('Failed to parse group metadata:', e);
  }

  return (
    <SigningModalDialog open={showInfoModal} onClose={() => setShowInfoModal(false)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <ProfileAvatar walletAddress={policyAddress} size={40} />
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-xl font-semibold text-secondary-content">Info</span>
        <div className="flex items-center space-x-4">
          <button
            aria-label={'leave-btn'}
            className="btn btn-error h-[52px] w-[140px]"
            onClick={handleLeave}
            disabled={isSigning}
          >
            {isSigning ? <span className="loading loading-dots loading-md"></span> : 'Leave'}
          </button>

          <button
            aria-label={'upgrade-btn'}
            className="btn btn-gradient text-white h-[52px] w-[140px]"
            onClick={() => setShowUpdateModal(true)}
          >
            Update
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-content-muted">Group Information</h4>
        <InfoItem label="Voting period" value={votingPeriodDisplay} />
        <InfoItem label="Qualified Majority" value={threshold} />

        <InfoItem label="Description" value={details} isProposal={true} />
        <InfoItem label="Policy Address" value={policyAddress} isAddress={true} />
        <h4 className="font-semibold mt-6 text-secondary-content">Authors</h4>
        {renderAuthors()}
      </div>

      {showUpdateModal && (
        <UpdateGroupModal
          group={group}
          policyAddress={policyAddress}
          address={address}
          onUpdate={onUpdate}
          showUpdateModal={showUpdateModal}
          setShowUpdateModal={setShowUpdateModal}
        />
      )}
    </SigningModalDialog>
  );
}

function InfoItem({
  label,
  value,
  isAddress = false,
  isProposal = false,
}: {
  label: string;
  value?: string;
  isAddress?: boolean;
  isProposal?: boolean;
}) {
  return (
    <div
      className={`bg-surface-inset p-3 rounded-lg ${
        isProposal || isAddress ? 'flex flex-col' : 'flex flex-row justify-between items-center'
      }`}
    >
      <span className="text-sm text-content-subtle">{isAddress ? '' : label}</span>
      {value && (
        <div className={`text-sm text-content-muted ${isProposal ? 'mt-2' : ''}`}>
          {isAddress ? (
            <div>
              <span className="text-sm text-content-subtle block mb-1">Address</span>
              <p className="text-sm text-content-muted xs:block hidden">
                <TruncatedAddressWithCopy address={value} />
              </p>
              <p className="text-sm text-content-muted xs:hidden block">
                <TruncatedAddressWithCopy address={value} />
              </p>
            </div>
          ) : (
            value
          )}
        </div>
      )}
    </div>
  );
}
