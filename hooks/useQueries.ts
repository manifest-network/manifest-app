import { QueryGroupsByMemberResponseSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/query';
import {
  GroupMemberSDKType,
  GroupPolicyInfoSDKType,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import { UseQueryResult, keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import axios from 'axios';
import { QueryProposalsByGroupPolicyResponse } from 'cosmjs-types/cosmos/group/v1/query';
import { Octokit } from 'octokit';
import { useEffect, useState } from 'react';

import { TxMessage } from '@/components/bank/types';
import env from '@/config/env';
import { useCosmWasmRpcQueryClient } from '@/hooks/useCosmWasmRpcQueryClient';
import { useOsmosisRpcQueryClient } from '@/hooks/useOsmosisRpcQueryClient';
import { useCosmosRpcQueryClient } from '@/hooks/useRpcQueryClient';
import { getLogoUrls } from '@/utils';

import { useLcdQueryClient, useOsmosisLcdQueryClient } from './useLcdQueryClient';
import { useManifestLcdQueryClient } from './useManifestLcdQueryClient';
import { usePoaLcdQueryClient } from './usePoaLcdQueryClient';

const DEBOUNCE_TIME = 1000;
const PAGE_DEBOUNCE_TIME = 30;

export type ExtendedGroupType = QueryGroupsByMemberResponseSDKType['groups'][0] & {
  policies: GroupPolicyInfoSDKType[];
  members: GroupMemberSDKType[];
};

export interface ExtendedQueryGroupsByMemberResponseSDKType {
  groups: ExtendedGroupType[];
}

export interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label: string | null;
    uploader: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
  }[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}

export const useGroupsByMember = (address: string) => {
  const { lcdQueryClient } = useLcdQueryClient();
  const [extendedGroups, setExtendedGroups] = useState<ExtendedQueryGroupsByMemberResponseSDKType>({
    groups: [],
  });
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const groupQuery = useQuery({
    queryKey: ['groupInfoByMember', address],
    queryFn: () => lcdQueryClient?.cosmos.group.v1.groupsByMember({ address }),
    enabled: !!lcdQueryClient && !!address,
  });

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (groupQuery.data?.groups && !groupQuery.isLoading) {
        try {
          const policyPromises = groupQuery.data.groups.map(group =>
            lcdQueryClient?.cosmos.group.v1.groupPoliciesByGroup({
              groupId: group.id,
            })
          );
          const memberPromises = groupQuery.data.groups.map(group =>
            lcdQueryClient?.cosmos.group.v1.groupMembers({ groupId: group.id })
          );

          const [policiesResults, membersResults] = await Promise.all([
            Promise.all(policyPromises),
            Promise.all(memberPromises),
          ]);

          const groupsWithAllData = groupQuery.data.groups.map((group, index) => ({
            ...group,

            policies: policiesResults[index]?.group_policies || [],
            members: membersResults[index]?.members || [],
          }));

          setExtendedGroups({ groups: groupsWithAllData });
        } catch (err) {
          console.error('Failed to fetch additional group data:', err);
          setError(err as Error);
        } finally {
          setAllDataLoaded(true);
        }
      }
    };

    fetchAdditionalData();
  }, [groupQuery.data, groupQuery.isLoading, lcdQueryClient?.cosmos.group.v1]);

  return {
    groupByMemberData: extendedGroups,
    isGroupByMemberLoading: !allDataLoaded,
    isGroupByMemberError: error || groupQuery.isError,
    refetchGroupByMember: groupQuery.refetch,
  };
};

export const useGroupsByAdmin = (admin: string) => {
  const { lcdQueryClient } = useLcdQueryClient();
  const [extendedGroups, setExtendedGroups] = useState<ExtendedQueryGroupsByMemberResponseSDKType>({
    groups: [],
  });
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const groupQuery = useQuery({
    queryKey: ['groupInfoByAdmin', admin],
    queryFn: () => lcdQueryClient?.cosmos.group.v1.groupsByAdmin({ admin }),
    enabled: !!lcdQueryClient && !!admin,
  });

  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (groupQuery.data?.groups && !groupQuery.isLoading) {
        try {
          const policyPromises = groupQuery.data.groups.map(group =>
            lcdQueryClient?.cosmos.group.v1.groupPoliciesByGroup({
              groupId: group.id,
            })
          );
          const memberPromises = groupQuery.data.groups.map(group =>
            lcdQueryClient?.cosmos.group.v1.groupMembers({ groupId: group.id })
          );

          const [policiesResults, membersResults] = await Promise.all([
            Promise.all(policyPromises),
            Promise.all(memberPromises),
          ]);

          const groupsWithAllData = groupQuery.data.groups.map((group, index) => ({
            ...group,
            policies: policiesResults[index]?.group_policies || [],
            members: membersResults[index]?.members || [],
          }));

          setExtendedGroups({ groups: groupsWithAllData });
        } catch (err) {
          console.error('Failed to fetch additional group data:', err);
          setError(err as Error);
        } finally {
          setAllDataLoaded(true);
        }
      }
    };

    fetchAdditionalData();
  }, [groupQuery.data, groupQuery.isLoading, lcdQueryClient?.cosmos.group.v1]);

  return {
    groupByAdmin: extendedGroups,
    isGroupByAdminLoading: !allDataLoaded,
    isGroupByAdminError: error || groupQuery.isError,
    refetchGroupByAdmin: groupQuery.refetch,
  };
};
export const useCurrentPlan = () => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchCurrentPlan = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.upgrade.v1beta1.currentPlan({});
  };

  const currentPlanQuery = useQuery({
    queryKey: ['currentPlan'],
    queryFn: fetchCurrentPlan,
    enabled: !!lcdQueryClient,
    staleTime: Infinity,
  });

  return {
    plan: currentPlanQuery.data?.plan,
    isPlanLoading: currentPlanQuery.isLoading,
    isPlanError: currentPlanQuery.isError,
    refetchPlan: currentPlanQuery.refetch,
  };
};

export const useProposalsByPolicyAccount = (policyAccount: string) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchGroupInfo = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.group.v1.proposalsByGroupPolicy({
      address: policyAccount,
    });
  };

  const debounced = useDebounce(policyAccount, DEBOUNCE_TIME);
  const proposalQuery = useQuery({
    queryKey: ['proposalInfo', debounced],
    queryFn: fetchGroupInfo,
    enabled: !!lcdQueryClient && !!policyAccount,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
  });

  return {
    proposals: proposalQuery.data?.proposals || [],
    isProposalsLoading: proposalQuery.isLoading,
    isProposalsError: proposalQuery.isError,
    refetchProposals: proposalQuery.refetch,
  };
};

interface UseProposalByIdOptions {
  refetchInterval?: number | false;
}

export const useProposalById = (proposalId: bigint, options: UseProposalByIdOptions = {}) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchProposalInfo = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.group.v1.proposal({ proposalId: proposalId });
  };

  const debounced = useDebounce(proposalId.toString(), DEBOUNCE_TIME);
  const proposalQuery = useQuery({
    queryKey: ['proposalInfoById', debounced],
    queryFn: fetchProposalInfo,
    enabled: !!lcdQueryClient && !!proposalId,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
  });

  return {
    proposal: proposalQuery.data?.proposal,
    isProposalLoading: proposalQuery.isLoading,
    isProposalError: proposalQuery.isError,
    refetchProposal: proposalQuery.refetch,
  };
};

export const useProposalsByPolicyAccountAll = (policyAccounts: string[]) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchGroupInfo = async (policyAccount: string) => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.group.v1.proposalsByGroupPolicy({
      address: policyAccount,
    });
  };

  const proposalQueries: UseQueryResult<QueryProposalsByGroupPolicyResponse, Error>[] = useQueries({
    queries: policyAccounts.map(policyAccount => ({
      queryKey: ['proposalInfoAll', policyAccount],
      queryFn: () => fetchGroupInfo(policyAccount),
      enabled: !!lcdQueryClient && !!policyAccount,
      staleTime: DEBOUNCE_TIME,
      placeholderData: keepPreviousData,
    })),
  });

  const result: Record<string, any> = {};

  proposalQueries.forEach((proposalQuery, index) => {
    result[policyAccounts[index]] = proposalQuery.data?.proposals || [];
  });

  return {
    proposalsByPolicyAccount: result,
    isProposalsLoading: proposalQueries.some(query => query.isLoading),
    isProposalsError: proposalQueries.some(query => query.isError),
    refetchProposals: () => proposalQueries.forEach(query => query.refetch()),
  };
};

export const useTallyCount = (proposalId: bigint) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchGroupInfo = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.group.v1.tallyResult({
      proposalId: proposalId,
    });
  };

  const debounced = useDebounce(proposalId.toString(), DEBOUNCE_TIME);
  const tallyQuery = useQuery({
    queryKey: ['tallyInfo', debounced],
    queryFn: fetchGroupInfo,
    enabled: !!lcdQueryClient && proposalId !== undefined,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
  });

  return {
    tally: tallyQuery.data,
    isTallyLoading: tallyQuery.isLoading,
    isTallyError: tallyQuery.isError,
    refetchTally: tallyQuery.refetch,
  };
};

export const useVotesByProposal = (proposalId: bigint) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchVoteInfo = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.group.v1.votesByProposal({
      proposalId: proposalId,
    });
  };

  const debounced = useDebounce(proposalId.toString(), DEBOUNCE_TIME);
  const voteQuery = useQuery({
    queryKey: ['voteInfo', debounced],
    queryFn: fetchVoteInfo,
    enabled: !!lcdQueryClient && proposalId !== undefined,
    staleTime: DEBOUNCE_TIME,
  });

  return {
    votes: voteQuery.data?.votes || [],
    isVotesLoading: voteQuery.isLoading,
    isVotesError: voteQuery.isError,
    refetchVotes: voteQuery.refetch,
  };
};

export const useBalance = (address: string) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchBalance = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.bank.v1beta1.spendableBalanceByDenom({
      denom: 'umfx',
      address,
    });
  };

  const balanceQuery = useQuery({
    queryKey: ['balanceInfo', address],
    queryFn: fetchBalance,
    enabled: !!lcdQueryClient && !!address,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return {
    balance: balanceQuery.data?.balance,
    isBalanceLoading: balanceQuery.isLoading,
    isBalanceError: balanceQuery.isError,
    refetchBalance: balanceQuery.refetch,
  };
};

export const useTotalSupply = () => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchBalances = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.bank.v1beta1.totalSupply({});
  };

  const totalSupplyQuery = useQuery({
    queryKey: ['totalSupply'],
    queryFn: fetchBalances,
    enabled: !!lcdQueryClient,
    staleTime: Infinity,
  });
  return {
    totalSupply: totalSupplyQuery.data?.supply,
    isTotalSupplyLoading: totalSupplyQuery.isLoading,
    isTotalSupplyError: totalSupplyQuery.isError,
    refetchTotalSupply: totalSupplyQuery.refetch,
  };
};
export const usePoaGetAdmin = () => {
  const { lcdQueryClient } = usePoaLcdQueryClient();

  const fetchPoaAdmin = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.strangelove_ventures.poa.v1.poaAuthority({});
  };

  const paramsQuery = useQuery({
    queryKey: ['paramsInfo', lcdQueryClient],
    queryFn: fetchPoaAdmin,
    enabled: !!lcdQueryClient,
    staleTime: Infinity,
    refetchOnMount: true,
  });

  return {
    poaAdmin: paramsQuery.data?.authority,
    isPoaAdminLoading: paramsQuery.isLoading,
    isPoaAdminError: paramsQuery.isError,
    refetchPoaAdmin: paramsQuery.refetch,
  };
};

export const usePendingValidators = () => {
  const { lcdQueryClient } = usePoaLcdQueryClient();

  const fetchParams = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.strangelove_ventures.poa.v1.pendingValidators({});
  };

  const paramsQuery = useQuery({
    queryKey: ['pendingVals'],
    queryFn: fetchParams,
    enabled: !!lcdQueryClient,
    staleTime: Infinity,
  });

  return {
    pendingValidators: paramsQuery.data?.pending,
    isPendingValidatorsLoading: paramsQuery.isLoading,
    isPendingValidatorsError: paramsQuery.isError,
    refetchPendingValidators: paramsQuery.refetch,
  };
};

export const useValidators = (status: string) => {
  const { lcdQueryClient } = useLcdQueryClient();
  const { lcdQueryClient: poaLcdQueryCLient } = usePoaLcdQueryClient();
  const fetchConsensusPower = async (validators: any[]) => {
    if (!lcdQueryClient || !poaLcdQueryCLient) {
      throw new Error('LCD Client not ready');
    }

    const promises = validators.map(async validator => {
      const consensusPowerResponse =
        await poaLcdQueryCLient.strangelove_ventures.poa.v1.consensusPower({
          validatorAddress: validator.operator_address,
        });
      const logoUrlResponse = await getLogoUrls(validator);
      return {
        ...validator,
        consensus_power: consensusPowerResponse.consensus_power,
        logo_url: logoUrlResponse,
      };
    });

    return await Promise.all(promises);
  };

  const fetchParams = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    const validatorsResponse = await lcdQueryClient.cosmos.staking.v1beta1.validators({
      status: status,
    });

    return await fetchConsensusPower(validatorsResponse.validators);
  };

  const paramsQuery = useQuery({
    queryKey: ['validators', status],
    queryFn: fetchParams,
    enabled: !!lcdQueryClient,
    staleTime: 5 * 60 * 1000,
  });

  return {
    validators: paramsQuery.data,
    isValidatorsLoading: paramsQuery.isLoading,
    isValidatorsError: paramsQuery.isError,
    refetchValidatorss: paramsQuery.refetch,
  };
};

export const useTokenFactoryDenomsFromAdmin = (address: string) => {
  const { lcdQueryClient } = useManifestLcdQueryClient();

  const fetchDenoms = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    if (!lcdQueryClient.osmosis) {
      throw new Error('Osmosis module not found in LCD client');
    }

    if (!address) {
      return { denoms: [] };
    }
    return await lcdQueryClient.osmosis.tokenfactory.v1beta1.denomsFromAdmin({
      admin: address,
    });
  };

  const debounced = useDebounce(address, DEBOUNCE_TIME);
  const denomsQuery = useQuery({
    queryKey: ['denoms', debounced],
    queryFn: fetchDenoms,
    enabled: !!lcdQueryClient && !!address,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
  });

  return {
    denoms: denomsQuery.data,
    isDenomsLoading: denomsQuery.isLoading,
    isDenomsError: denomsQuery.isError,
    denomError: denomsQuery.error,
    refetchDenoms: denomsQuery.refetch,
  };
};

// We can't use the REST client here because the subdenom is not supported by the REST API
export const useDenomAuthorityMetadata = (denom: string) => {
  const { rpcQueryClient } = useOsmosisRpcQueryClient();

  const fetchAuthority = async () => {
    if (!rpcQueryClient) {
      throw new Error('RPC Client not ready');
    }
    if (!denom) {
      throw new Error('Denom not provided');
    }
    return await rpcQueryClient.osmosis.tokenfactory.v1beta1.denomAuthorityMetadata({
      denom: denom,
    });
  };

  const debounced = useDebounce(denom, DEBOUNCE_TIME);
  const denomsQuery = useQuery({
    queryKey: ['authority', debounced],
    queryFn: fetchAuthority,
    enabled: !!rpcQueryClient && !!denom,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
  });
  return {
    denomAuthority: denomsQuery.data?.authorityMetadata,
    isDenomAuthorityLoading: denomsQuery.isLoading,
    isDenomAuthorityError: denomsQuery.isError,
    refetchDenomAuthority: denomsQuery.refetch,
  };
};

export const useTokenFactoryDenomsMetadata = () => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchAllDenoms = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }

    let allMetadatas: any[] = [];
    let nextKey: Uint8Array | undefined = undefined;

    // Fetch all pages of metadata
    do {
      const paginationOptions: any = {
        limit: BigInt(1000), // Request more per page to reduce API calls
      };

      if (nextKey) {
        paginationOptions.key = nextKey;
      }

      const response = await lcdQueryClient.cosmos.bank.v1beta1.denomsMetadata({
        pagination: paginationOptions,
      });

      if (response.metadatas) {
        allMetadatas = allMetadatas.concat(response.metadatas);
      }

      nextKey = response.pagination?.next_key;
    } while (nextKey && nextKey.length > 0);

    return { metadatas: allMetadatas };
  };

  const denomsQuery = useQuery({
    queryKey: ['allMetadatas'],
    queryFn: fetchAllDenoms,
    enabled: !!lcdQueryClient,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since metadata doesn't change often
  });

  return {
    metadatas: denomsQuery.data,
    isMetadatasLoading: denomsQuery.isLoading,
    isMetadatasError: denomsQuery.isError,
    refetchMetadatas: denomsQuery.refetch,
  };
};

export const useTokenMetadata = (denom?: string) => {
  const { rpcQueryClient } = useCosmosRpcQueryClient();

  const fetchMetadata = async () => {
    if (!rpcQueryClient) {
      throw new Error('RPC Client not ready');
    }
    if (!denom) {
      throw new Error('Denom not provided');
    }
    return await rpcQueryClient.cosmos.bank.v1beta1.denomMetadata({
      denom: denom,
    });
  };
  const debounced = useDebounce(denom, DEBOUNCE_TIME);
  const metadataQuery = useQuery({
    queryKey: ['metadata', debounced],
    queryFn: fetchMetadata,
    enabled: !!rpcQueryClient && !!denom,
    staleTime: DEBOUNCE_TIME,
    placeholderData: keepPreviousData,
  });
  return {
    metadata: metadataQuery.data?.metadata,
    isMetadataLoading: metadataQuery.isLoading,
    isMetadataError: metadataQuery.isError,
    refetchMetadata: metadataQuery.refetch,
    error: metadataQuery.error,
  };
};

export const useOsmosisTokenFactoryDenomsMetadata = () => {
  const { lcdQueryClient } = useOsmosisLcdQueryClient();

  const fetchDenoms = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }

    return await lcdQueryClient.cosmos.bank.v1beta1.denomsMetadata({});
  };

  const denomsQuery = useQuery({
    queryKey: ['osmosisAllMetadatas'],
    queryFn: fetchDenoms,
    enabled: !!lcdQueryClient,
    staleTime: Infinity,
  });

  return {
    metadatas: denomsQuery.data,
    isMetadatasLoading: denomsQuery.isLoading,
    isMetadatasError: denomsQuery.isError,
    refetchMetadatas: denomsQuery.refetch,
  };
};

export const useTokenBalances = (address: string) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchBalances = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.bank.v1beta1.spendableBalances({
      address,
    });
  };

  const balancesQuery = useQuery({
    queryKey: ['balances', address],
    queryFn: fetchBalances,
    enabled: !!lcdQueryClient && !!address,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return {
    balances: balancesQuery.data?.balances,
    isBalancesLoading: balancesQuery.isLoading,
    isBalancesError: balancesQuery.isError,
    refetchBalances: balancesQuery.refetch,
  };
};

export const useTokenBalancesResolved = (address: string) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchBalances = async () => {
    if (!lcdQueryClient) {
      throw new Error('LCD Client not ready');
    }
    return await lcdQueryClient.cosmos.bank.v1beta1.allBalances({
      address,
      resolveDenom: true,
    });
  };

  const balancesQuery = useQuery({
    queryKey: ['balances-resolved', address],
    queryFn: fetchBalances,
    enabled: !!lcdQueryClient && !!address,
    staleTime: 5000,
    refetchInterval: 10000,
  });

  return {
    balances: balancesQuery.data?.balances,
    isBalancesLoading: balancesQuery.isLoading,
    isBalancesError: balancesQuery.isError,
    refetchBalances: balancesQuery.refetch,
  };
};

export const useGetMessagesFromAddress = (
  indexerUrl: string,
  address: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const debouncedAddress = useDebounce(address, DEBOUNCE_TIME);
  const debouncedPage = useDebounce(page, PAGE_DEBOUNCE_TIME);
  const debouncedPageSize = useDebounce(pageSize, PAGE_DEBOUNCE_TIME);

  const fetchMessages = async () => {
    const baseUrl = `${indexerUrl}/rpc/get_messages_for_address?_address=${debouncedAddress}`;

    // Update order parameter to sort by timestamp instead of height
    const offset = (debouncedPage - 1) * debouncedPageSize;
    const paginationParams = `&limit=${debouncedPageSize}&offset=${offset}`;
    const orderParam = `&order=timestamp.desc`;

    const finalUrl = `${baseUrl}${orderParam}${paginationParams}`;

    try {
      const countResponse = await axios.get(baseUrl, {
        headers: {
          Prefer: 'count=exact',
          'Range-Unit': 'items',
          Range: '0-0', // We only need the count, not the actual data
        },
      });

      // Get the total count from the content-range header
      const contentRange = countResponse.headers['content-range'];
      const totalCount = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

      // Then get the paginated data
      const dataResponse = await axios.get(finalUrl, {
        headers: {
          'Range-Unit': 'items',
          Range: `${offset}-${offset + debouncedPageSize - 1}`,
        },
      });

      const transactions = dataResponse.data.sort((a: TxMessage, b: TxMessage) => {
        // Sort by timestamp descending (newest first)
        const dateComparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (dateComparison !== 0) return dateComparison;
        // If timestamps are equal, sort by block number descending
        const blockComparison = b.height - a.height;
        if (blockComparison !== 0) return blockComparison;
        // If block numbers are equal, sort by index descending
        return b.message_index - a.message_index;
      });

      return {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / debouncedPageSize),
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const sendQuery = useQuery({
    queryKey: ['getMessagesForAddress', debouncedAddress, debouncedPage, debouncedPageSize],
    queryFn: fetchMessages,
    enabled: !!debouncedAddress,
    staleTime: DEBOUNCE_TIME,
    refetchInterval: 2000,
    placeholderData: keepPreviousData,
  });

  return {
    sendTxs: sendQuery.data?.transactions,
    totalCount: sendQuery.data?.totalCount,
    totalPages: sendQuery.data?.totalPages || 1,
    isLoading: sendQuery.isLoading,
    isError: sendQuery.isError,
    error: sendQuery.error,
    refetch: sendQuery.refetch,
  };
};

export const useMultipleTallyCounts = (proposalIds: bigint[]) => {
  const { lcdQueryClient } = useLcdQueryClient();

  const tallyQueries = useQueries({
    queries: proposalIds.map(proposalId => ({
      queryKey: ['tallyInfo', proposalId.toString()],
      queryFn: async () => {
        if (!lcdQueryClient) {
          throw new Error('LCD Client not ready');
        }
        return await lcdQueryClient.cosmos.group.v1.tallyResult({
          proposalId: proposalId,
        });
      },
      enabled: !!lcdQueryClient && !!proposalId,
      staleTime: Infinity,
    })),
  });

  return {
    tallies: tallyQueries.map((query, index) => ({
      proposalId: proposalIds[index],
      tally: query.data,
    })),
    isLoading: tallyQueries.some(query => query.isLoading),
    isError: tallyQueries.some(query => query.isError),
    refetchTallies: () => tallyQueries.forEach(query => query.refetch()),
  };
};

export const useGitHubReleases = () => {
  const octokit = new Octokit({});

  const fetchReleases = async () => {
    try {
      const response = await octokit.rest.repos.listReleases({
        owner: 'manifest-network',
        repo: 'manifest-ledger',
      });
      return response.data as GitHubRelease[];
    } catch (error) {
      console.error('Error fetching GitHub releases:', error);
      throw error;
    }
  };

  const releasesQuery = useQuery({
    queryKey: ['githubReleases'],
    queryFn: fetchReleases,
  });

  return {
    releases: releasesQuery.data || [],
    isReleasesLoading: releasesQuery.isLoading,
    isReleasesError: releasesQuery.isError,
    refetchReleases: releasesQuery.refetch,
  };
};

export const useBlockHeight = () => {
  const { lcdQueryClient } = useLcdQueryClient();

  const fetchBlockHeight = async () => {
    const response = await lcdQueryClient?.cosmos.base.node.v1beta1.status();
    return response?.height;
  };

  const blockHeightQuery = useQuery({
    queryKey: ['blockHeight'],
    queryFn: fetchBlockHeight,
    enabled: !!lcdQueryClient,
    staleTime: 0,
    refetchInterval: 6000,
  });

  return {
    blockHeight: blockHeightQuery.data,
    isBlockHeightLoading: blockHeightQuery.isLoading,
    isBlockHeightError: blockHeightQuery.isError,
    refetchBlockHeight: blockHeightQuery.refetch,
  };
};

export type MfxPwrConversionConfig = {
  poa_admin: string;
  rate: string;
  source_denom: string;
  target_denom: string;
  paused: boolean;
};

export const useMfxPwrConversionConfig = () => {
  const { rpcQueryClient } = useCosmWasmRpcQueryClient();

  const fetchConfig = async () => {
    if (!rpcQueryClient) {
      throw new Error('RPC Client not ready');
    }
    return await rpcQueryClient.cosmwasm.wasm.v1.smartContractState({
      address: env.mfxToPwrConversionContractAddress!,
      queryData: new TextEncoder().encode(JSON.stringify({ config: {} })),
    });
  };

  const configQuery = useQuery({
    queryKey: ['mfxPwrConversionConfig'],
    queryFn: fetchConfig,
    enabled: !!rpcQueryClient && !!env.mfxToPwrConversionContractAddress,
    staleTime: DEBOUNCE_TIME,
    select: ({ data }) => {
      const decodedData: MfxPwrConversionConfig = JSON.parse(new TextDecoder().decode(data));
      return decodedData;
    },
  });

  return {
    config: configQuery.data,
    isConfigLoading: configQuery.isLoading,
    isConfigError: configQuery.isError,
    error: configQuery.error,
    refetchConfig: configQuery.refetch,
  };
};
