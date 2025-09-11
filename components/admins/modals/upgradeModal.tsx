import { Dialog } from '@headlessui/react';
import { cosmos } from '@manifest-network/manifestjs';
import { MsgSoftwareUpgrade } from '@manifest-network/manifestjs/dist/codegen/cosmos/upgrade/v1beta1/tx';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import React, { useMemo, useState } from 'react';
import { PiCaretDownBold } from 'react-icons/pi';

import { SigningModalDialog } from '@/components';
import { SearchIcon } from '@/components/icons';
import { TextInput } from '@/components/react/inputs';
import env from '@/config/env';
import { GitHubRelease, useBlockHeight, useFeeEstimation, useGitHubReleases, useTx } from '@/hooks';
import Yup from '@/utils/yupExtensions';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: string;
  address: string;
}

interface UpgradeInfo {
  name: string;
  upgradeable: boolean;
  commitHash: string;
}

const parseReleaseBody = (body: string): UpgradeInfo | null => {
  try {
    const nameMatch = body.match(/- \*\*Upgrade Handler Name\*\*: (.*?)(?:\r?\n|$)/);
    const upgradeableMatch = body.match(/- \*\*Upgradeable\*\*: (.*?)(?:\r?\n|$)/);
    const commitHashMatch = body.match(/- \*\*Commit Hash\*\*: (.*?)(?:\r?\n|$)/);

    if (!nameMatch || !upgradeableMatch || !commitHashMatch) {
      console.warn('Failed matches:', { nameMatch, upgradeableMatch, commitHashMatch });
      return null;
    }

    return {
      name: nameMatch[1].trim(),
      upgradeable: upgradeableMatch[1].trim().toLowerCase() === 'true',
      commitHash: commitHashMatch[1].trim(),
    };
  } catch (error) {
    console.error('Error parsing release body:', error);
    return null;
  }
};

const UPGRADE_MIN_BLOCK_OFFSET = env.upgradeMinBlockOffset ?? 1000;

const UpgradeSchema = Yup.object().shape({
  height: Yup.number()
    .typeError('Height must be a number')
    .required('Height is required')
    .integer('Must be a valid number')
    .test(
      'min-height',
      `Height must be at least ${UPGRADE_MIN_BLOCK_OFFSET} blocks above current height`,
      function (inputHeight) {
        const proposedHeight = Number(inputHeight);
        const chainHeight = Number(this.options.context?.chainData?.currentHeight || 0);

        if (Number.isNaN(proposedHeight) || Number.isNaN(chainHeight)) {
          return false;
        }

        const minimumAllowedHeight = chainHeight + UPGRADE_MIN_BLOCK_OFFSET;

        return proposedHeight >= minimumAllowedHeight;
      }
    ),
});

export function UpgradeModal({ isOpen, onClose, admin, address }: BaseModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { releases, isReleasesLoading } = useGitHubReleases();
  const queryClient = useQueryClient();
  const { blockHeight } = useBlockHeight();

  // Filter releases that are upgradeable
  const upgradeableReleases = useMemo(() => {
    const allReleases = [...(releases || [])];
    return allReleases
      .map(release => ({
        ...release,
        upgradeInfo: parseReleaseBody(release.body),
      }))
      .filter(release => release.upgradeInfo?.upgradeable);
  }, [releases]);

  const filteredReleases = upgradeableReleases.filter(release =>
    release.tag_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { softwareUpgrade } = cosmos.upgrade.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);

  const handleUpgrade = async (values: {
    name: string;
    height: string;
    info: string;
    selectedVersion: (GitHubRelease & { upgradeInfo?: UpgradeInfo | null }) | null;
  }) => {
    const selectedRelease = values.selectedVersion;
    const binaryLinks: { [key: string]: string } = {};

    // Map assets to their platform-specific links
    selectedRelease?.assets?.forEach(asset => {
      if (asset.name.includes('linux-amd64')) {
        binaryLinks['linux/amd64'] = asset.browser_download_url;
      } else if (asset.name.includes('linux-arm64')) {
        binaryLinks['linux/arm64'] = asset.browser_download_url;
      } else if (asset.name.includes('darwin-amd64')) {
        binaryLinks['darwin/amd64'] = asset.browser_download_url;
      } else if (asset.name.includes('darwin-arm64')) {
        binaryLinks['darwin/arm64'] = asset.browser_download_url;
      }
    });

    const infoObject = {
      commitHash: values.selectedVersion?.upgradeInfo?.commitHash || '',
      binaries: binaryLinks,
    };

    const msgUpgrade = softwareUpgrade({
      plan: {
        name: values.name,
        height: BigInt(values.height),
        time: new Date('0001-01-01T00:00:00Z'),
        info: JSON.stringify(infoObject),
      },
      authority: admin,
    });

    const anyMessage = Any.fromPartial({
      typeUrl: msgUpgrade.typeUrl,
      value: MsgSoftwareUpgrade.encode(msgUpgrade.value).finish(),
    });

    const groupProposalMsg = submitProposal({
      groupPolicyAddress: admin,
      messages: [anyMessage],
      metadata: '',
      proposers: [address ?? ''],
      title: `Upgrade the chain`,
      summary: `This proposal will upgrade the chain`,
      exec: 0,
    });

    await tx([groupProposalMsg], {
      fee: () => estimateFee(address ?? '', [groupProposalMsg]),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['currentPlan'] });
      },
    });
  };

  const initialValues = {
    name: '',
    height: '',
    info: '',
    selectedVersion: null as (GitHubRelease & { upgradeInfo?: UpgradeInfo | null }) | null,
  };
  const validationContext = useMemo(
    () => ({
      chainData: {
        currentHeight: Number(blockHeight),
      },
    }),
    [blockHeight]
  );

  if (!isOpen) return null;

  return (
    <SigningModalDialog
      open={isOpen}
      onClose={onClose}
      title="Chain Upgrade"
      panelClassName="max-w-4xl"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={UpgradeSchema}
        validate={values => {
          return UpgradeSchema.validate(values, { context: validationContext })
            .then(() => ({}))
            .catch(err => {
              return err.errors.reduce((acc: { [key: string]: string }, curr: string) => {
                acc[err.path] = curr;
                return acc;
              }, {});
            });
        }}
        onSubmit={values => {
          handleUpgrade({
            name: values.selectedVersion?.upgradeInfo?.name || '',
            height: values.height,
            info: values.selectedVersion?.upgradeInfo?.commitHash || '',
            selectedVersion: values.selectedVersion,
          });
        }}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ isValid, dirty, values, handleChange, handleSubmit, setFieldValue, resetForm }) => (
          <>
            <Form className="py-4 space-y-6">
              <div className="grid gap-6">
                <div className="w-full">
                  <label className="label">
                    <span className="label-text text-md font-medium text-[#00000099] dark:text-[#FFFFFF99]">
                      VERSION
                    </span>
                  </label>
                  <div className="relative">
                    <div className="dropdown dropdown-end w-full">
                      <label
                        aria-label="version-selector"
                        tabIndex={0}
                        className="btn btn-md w-full justify-between border border-[#00000033] dark:border-[#FFFFFF33] bg-[#E0E0FF0A] dark:bg-[#E0E0FF0A] hover:bg-transparent"
                        style={{ borderRadius: '12px' }}
                      >
                        {values.selectedVersion?.tag_name || 'Select Version'}
                        <PiCaretDownBold className="ml-1" />
                      </label>
                      <ul
                        tabIndex={0}
                        role="listbox"
                        aria-label="Version selection"
                        className="dropdown-content z-20 p-2 shadow-sm bg-base-300 rounded-lg w-full mt-1 max-h-72 overflow-y-auto dark:text-[#FFFFFF] text-[#161616]"
                      >
                        <li className="bg-base-300 z-30 hover:bg-transparent h-full mb-2">
                          <div className="px-2 py-1 relative">
                            <input
                              type="text"
                              placeholder="Search versions..."
                              className="input input-sm w-full pr-8 focus:outline-hidden focus:ring-0 border border-[#00000033] dark:border-[#FFFFFF33] bg-[#E0E0FF0A] dark:bg-[#E0E0FF0A]"
                              onChange={e => setSearchTerm(e.target.value)}
                              style={{ boxShadow: 'none', borderRadius: '8px' }}
                            />
                            <SearchIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </li>
                        {isReleasesLoading ? (
                          <li>
                            <a className="block px-4 py-2">Loading versions...</a>
                          </li>
                        ) : (
                          filteredReleases?.map(release => (
                            <li
                              key={release.id}
                              onClick={e => {
                                setFieldValue('selectedVersion', release);
                                setFieldValue('name', release.upgradeInfo?.name || '');
                                setFieldValue('info', release.upgradeInfo?.commitHash || '');
                                // Get the dropdown element and remove focus
                                const dropdown = (e.target as HTMLElement).closest('.dropdown');
                                if (dropdown) {
                                  (dropdown as HTMLElement).removeAttribute('open');
                                  (dropdown.querySelector('label') as HTMLElement)?.focus();
                                  (dropdown.querySelector('label') as HTMLElement)?.blur();
                                }
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setFieldValue('selectedVersion', release);
                                  setFieldValue('name', release.upgradeInfo?.name || '');
                                  setFieldValue('info', release.upgradeInfo?.commitHash || '');
                                  // Get the dropdown element and remove focus
                                  const dropdown = (e.target as HTMLElement).closest('.dropdown');
                                  if (dropdown) {
                                    (dropdown as HTMLElement).removeAttribute('open');
                                    (dropdown.querySelector('label') as HTMLElement)?.focus();
                                    (dropdown.querySelector('label') as HTMLElement)?.blur();
                                  }
                                }
                              }}
                              className="hover:bg-[#E0E0FF33] dark:hover:bg-[#FFFFFF0F] cursor-pointer rounded-lg"
                            >
                              <a className="flex flex-row items-center gap-2 px-2 py-2">
                                <span className="truncate">{release.tag_name}</span>
                              </a>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                <TextInput
                  label={`HEIGHT (Current: ${blockHeight})`}
                  name="height"
                  type="number"
                  value={values.height}
                  onChange={handleChange}
                  placeholder="Block height for upgrade"
                  min="0"
                />
                <TextInput
                  label="NAME"
                  name="name"
                  value={values.selectedVersion?.upgradeInfo?.name || ''}
                  disabled={true}
                  placeholder="Name will be set from version"
                />
                <TextInput
                  label="COMMIT HASH"
                  name="info"
                  value={values.selectedVersion?.upgradeInfo?.commitHash || ''}
                  disabled={true}
                  placeholder="Commit hash will appear here"
                />
              </div>

              <div className="mt-4 flex flex-row justify-center gap-2 w-full">
                <button
                  type="button"
                  className="btn w-1/2 focus:outline-hidden dark:bg-[#FFFFFF0F] bg-[#0000000A] dark:text-white text-black"
                  onClick={() => {
                    onClose();
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn w-1/2 btn-gradient text-white"
                  onClick={() => handleSubmit()}
                  disabled={isSigning || !isValid || !dirty || !values.selectedVersion}
                >
                  {isSigning ? <span className="loading loading-dots"></span> : 'Upgrade'}
                </button>
              </div>
            </Form>
          </>
        )}
      </Formik>
    </SigningModalDialog>
  );
}
