import { Chain } from '@chain-registry/types';
import { cosmos } from '@manifest-network/manifestjs';
import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import { MsgSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';
import {
  MemberSDKType,
  ProposalExecutorResult,
  ProposalSDKType,
  ProposalStatus,
  VoteOption,
} from '@manifest-network/manifestjs/dist/codegen/cosmos/group/v1/types';
import { BondStatus } from '@manifest-network/manifestjs/dist/codegen/cosmos/staking/v1beta1/staking';
import { Any } from '@manifest-network/manifestjs/dist/codegen/google/protobuf/any';
import {
  MsgBurnHeldBalance,
  MsgPayout,
} from '@manifest-network/manifestjs/dist/codegen/liftedinit/manifest/v1/tx';
import {
  MsgBurn,
  MsgMint,
} from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';

import { ExtendedValidatorSDKType } from '@/components';
import { TxMessage } from '@/components/bank/types';
import { FormData, ProposalFormData } from '@/helpers';
import { ExtendedGroupType } from '@/hooks';
import { MFX_TOKEN_BASE, unsafeConvertTokenBase } from '@/utils';
import { CombinedBalanceInfo, ExtendedMetadataSDKType } from '@/utils/types';

export const manifestAddr1 = 'manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct';
export const manifestAddr2 = 'manifest1efd63aw40lxf3n4mhf7dzhjkr453axurm6rp3z';

export const mockDenomMeta1: MetadataSDKType = {
  description: 'My First Token',
  name: 'Token 1',
  symbol: 'TK1',
  uri: '',
  uri_hash: '',
  display: 'Token 1',
  base: 'token1',
  denom_units: [
    { denom: 'utoken1', exponent: 0, aliases: ['utoken1'] },
    { denom: 'token1', exponent: 6, aliases: ['token1'] },
  ],
};

export const mockDenomMeta2: MetadataSDKType = {
  description: 'My Second Token',
  name: 'Token 2',
  symbol: 'TK2',
  uri: '',
  uri_hash: '',
  display: 'Token 2',
  base: 'token2',
  denom_units: [
    { denom: 'utoken2', exponent: 0, aliases: ['utoken2'] },
    { denom: 'token2', exponent: 6, aliases: ['token2'] },
  ],
};

export const mockBalances: CombinedBalanceInfo[] = [
  {
    display: 'token1',
    base: unsafeConvertTokenBase('utoken1'),
    amount: '1000',
    metadata: mockDenomMeta1,
  },
  {
    display: 'token2',
    base: unsafeConvertTokenBase('utoken2'),
    amount: '2000',
    metadata: mockDenomMeta2,
  },
];

export const mockActiveValidators: ExtendedValidatorSDKType[] = [
  {
    operator_address: 'validator1',
    description: {
      moniker: 'Validator One',
      identity: 'identity1',
      details: 'details1',
      website: 'website1.com',
      security_contact: 'security1@foobar.com',
    },
    consensus_power: BigInt(1000),
    logo_url: '',
    jailed: false,
    status: BondStatus.BOND_STATUS_BONDED,
    tokens: '1000upoa',
    delegator_shares: '1000',
    min_self_delegation: '1',
    unbonding_height: 0n,
    unbonding_time: new Date(0),
    commission: {
      commission_rates: {
        rate: '0.1',
        max_rate: '0.2',
        max_change_rate: '0.01',
      },
      update_time: new Date(),
    },
    unbonding_on_hold_ref_count: 0n,
    unbonding_ids: [],
  },
  {
    operator_address: 'validator2',
    description: {
      moniker: 'Validator Two',
      identity: 'identity2',
      details: 'details2',
      website: 'website2.com',
      security_contact: 'security2',
    },
    consensus_power: BigInt(2000),
    logo_url: '',
    jailed: false,
    status: BondStatus.BOND_STATUS_BONDED,
    tokens: '2000upoa',
    delegator_shares: '2000',
    min_self_delegation: '1',
    unbonding_height: 0n,
    unbonding_time: new Date(0),
    commission: {
      commission_rates: {
        rate: '0.1',
        max_rate: '0.2',
        max_change_rate: '0.01',
      },
      update_time: new Date(),
    },
    unbonding_on_hold_ref_count: 0n,
    unbonding_ids: [],
  },
];

export const mockPendingValidators: ExtendedValidatorSDKType[] = [
  {
    operator_address: 'validator3',
    description: {
      moniker: 'Validator Three',
      identity: 'identity2',
      details: 'details2',
      website: 'website2.com',
      security_contact: 'security2',
    },
    consensus_power: BigInt(3000),
    logo_url: '',
    jailed: false,
    status: BondStatus.BOND_STATUS_UNBONDED,
    tokens: '3000upoa',
    delegator_shares: '3000',
    min_self_delegation: '1',
    unbonding_height: 0n,
    unbonding_time: new Date(0),
    commission: {
      commission_rates: {
        rate: '0.1',
        max_rate: '0.2',
        max_change_rate: '0.01',
      },
      update_time: new Date(),
    },
    unbonding_on_hold_ref_count: 0n,
    unbonding_ids: [],
  },
];

export const mockUnboundingValidators: ExtendedValidatorSDKType[] = [
  {
    operator_address: 'validator4',
    description: {
      moniker: 'Validator Four',
      identity: 'identity4',
      details: 'details4',
      website: 'website4.com',
      security_contact: 'security4',
    },
    consensus_power: BigInt(0),
    logo_url: '',
    jailed: false,
    status: BondStatus.BOND_STATUS_UNBONDING,
    tokens: '0upoa',
    delegator_shares: '0',
    min_self_delegation: '1',
    unbonding_height: 1235n,
    unbonding_time: new Date(12345),
    commission: {
      commission_rates: {
        rate: '0.1',
        max_rate: '0.2',
        max_change_rate: '0.01',
      },
      update_time: new Date(),
    },
    unbonding_on_hold_ref_count: 0n,
    unbonding_ids: [1n],
  },
];

export const defaultAssetLists = [
  {
    chain_name: 'manifest',
    assets: [
      {
        name: 'Manifest Network Token',
        display: 'umfx',
        base: 'umfx',
        symbol: 'umfx',
        denom_units: [{ denom: 'umfx', exponent: 0, aliases: ['umfx'] }],
      },
    ],
  },
];

export const osmosisAssetList = [
  {
    chain_name: 'osmosistestnet',
    assets: [
      {
        name: 'Osmosis Testnet Token',
        display: 'uosmo',
        base: 'uosmo',
        symbol: 'uosmo',
        denom_units: [{ denom: 'uosmo', exponent: 0, aliases: ['uosmo'] }],
      },
    ],
  },
];

export const osmosisChain: Chain = {
  chain_name: 'osmosistestnet',
  chain_id: 'osmo-test-5',
  status: 'live',
  network_type: 'testnet',
  pretty_name: 'Osmosis Testnet',
  bech32_prefix: 'osmo',
  slip44: 118,
  fees: {
    fee_tokens: [
      {
        denom: 'uosmo',
        fixed_min_gas_price: 0.001,
        low_gas_price: 0.001,
        average_gas_price: 0.001,
        high_gas_price: 0.001,
      },
    ],
  },
};

export const defaultChain: Chain = {
  chain_name: 'manifest',
  chain_id: 'manifest-1',
  status: 'live',
  network_type: 'testnet',
  pretty_name: 'Manifest Network',
  bech32_prefix: 'manifest',
  slip44: 118,
  fees: {
    fee_tokens: [
      {
        denom: 'umfx',
        fixed_min_gas_price: 0.001,
        low_gas_price: 0.001,
        average_gas_price: 0.001,
        high_gas_price: 0.001,
      },
    ],
  },
};

export const mockTransactions: TxMessage[] = [
  {
    id: '1',
    message_index: 1,
    type: MsgSend.typeUrl,
    sender: 'address1',
    mentions: ['mention1'],
    metadata: {
      amount: [{ amount: '1000000000000000000000000', denom: 'utoken' }],
      toAddress: 'address2',
    },
    fee: { amount: [{ amount: '1', denom: 'denom1' }], gas: '1' },
    memo: 'memo1',
    height: 1,
    timestamp: '1900-01-01',
    error: '',
    proposal_ids: ['proposal1'],
  },
  {
    id: '2',
    message_index: 2,
    type: MsgSend.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: {
      amount: [{ amount: '2000000000000000000000', denom: 'utoken' }],
      toAddress: 'address1',
    },
    fee: { amount: [{ amount: '2', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 2,
    timestamp: '2023-05-02T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '3',
    message_index: 3,
    type: MsgMint.typeUrl,
    sender: 'address1',
    mentions: [],
    metadata: {
      amount: { amount: '3000000000000000000', denom: 'utoken' },
      mintToAddress: 'address2',
    },
    fee: { amount: [{ amount: '3', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 3,
    timestamp: '2023-05-03T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '4',
    message_index: 4,
    type: MsgBurn.typeUrl,
    sender: 'address2',
    mentions: ['address1', 'address2'],
    metadata: {
      amount: { amount: '1200000000000000', denom: 'utoken' },
      burnFromAddress: 'address1',
    },
    fee: { amount: [{ amount: '4', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 4,
    timestamp: '2023-05-04T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '5',
    message_index: 5,
    type: MsgPayout.typeUrl,
    sender: 'address1',
    mentions: [],
    metadata: {
      payoutPairs: [{ coin: { amount: '5000000000000', denom: 'utoken' }, address: 'address2' }],
    },
    fee: { amount: [{ amount: '5', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 5,
    timestamp: '2023-05-05T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '6',
    message_index: 6,
    type: MsgBurnHeldBalance.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: { burnCoins: [{ amount: '2100000', denom: 'utoken' }] },
    fee: { amount: [{ amount: '6', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 6,
    timestamp: '2023-05-06T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '7',
    message_index: 7,
    type: MsgPayout.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: {
      payoutPairs: [{ coin: { amount: '2300000', denom: 'utoken' }, address: 'address1' }],
    },
    fee: { amount: [{ amount: '7', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 7,
    timestamp: '2023-05-07T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '8',
    message_index: 8,
    type: MsgPayout.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: {
      payoutPairs: [{ coin: { amount: '2400000', denom: 'utoken' }, address: 'address1' }],
    },
    fee: { amount: [{ amount: '8', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 8,
    timestamp: '2023-05-08T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '9',
    message_index: 9,
    type: MsgPayout.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: {
      payoutPairs: [{ coin: { amount: '2500000', denom: 'utoken' }, address: 'address1' }],
    },
    fee: { amount: [{ amount: '9', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 9,
    timestamp: '2023-05-09T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '10',
    message_index: 10,
    type: MsgPayout.typeUrl,
    sender: 'address2',
    mentions: [],
    metadata: {
      payoutPairs: [{ coin: { amount: '2600000', denom: 'utoken' }, address: 'address1' }],
    },
    fee: { amount: [{ amount: '1', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 10,
    timestamp: '2023-05-10T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
];

export const mockMultiDenomTransactions: TxMessage[] = [
  {
    id: '11',
    message_index: 1,
    type: MsgSend.typeUrl,
    sender: 'address3',
    mentions: [],
    metadata: {
      amount: [
        { amount: '123123123123123', denom: 'utoken' },
        { amount: '12345678', denom: 'ufoobar' },
      ],
      toAddress: 'address4',
    },
    fee: { amount: [{ amount: '1', denom: 'denom1' }], gas: '1' },
    memo: '',
    height: 11,
    timestamp: '2023-05-10T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
  {
    id: '12',
    message_index: 2,
    type: MsgSend.typeUrl,
    sender: 'address3',
    mentions: [],
    metadata: {
      amount: [
        { amount: '5000000', denom: 'utoken' },
        { amount: '6000000', denom: 'ufoobar' },
        { amount: '121212', denom: 'umore' },
      ],
      toAddress: 'address4',
    },
    fee: { amount: [{ amount: '1', denom: 'denom1' }], gas: '1' },
    memo: '',
    height: 11,
    timestamp: '2023-05-10T12:00:00Z',
    error: '',
    proposal_ids: [],
  },
];

export const mockGroup: ExtendedGroupType = {
  id: 1n,
  admin: 'admin1',
  metadata: JSON.stringify({
    title: 'title1',
    summary: 'summary1',
    details: 'details1 at least 20 characters',
    authors: [manifestAddr1, manifestAddr2],
    voteOptionContext: 'context1',
  }),
  version: 1n,
  created_at: new Date(),
  total_weight: '10',
  policies: [
    {
      group_id: 1n,
      admin: 'admin1',
      metadata: 'metadata1',
      version: 1n,
      created_at: new Date(),
      address: 'test_policy_address',
      decision_policy: {
        threshold: '5',
      },
    },
  ],
  members: [
    {
      group_id: 1n,
      member: {
        address: 'test_address1',
        weight: '5',
        metadata: 'test_metadata1',
        added_at: new Date(),
      },
    },
    {
      group_id: 1n,
      member: {
        address: 'test_address2',
        weight: '5',
        metadata: 'test_metadata2',
        added_at: new Date(),
      },
    },
  ],
};

export const mockGroup2: ExtendedGroupType = {
  id: 2n,
  admin: 'admin2',
  metadata:
    '{"title": "title2", "summary": "summary2", "details": "details2", "authors": ["author2, author3"], "voteOptionContext": "context2"}',
  version: 1n,
  created_at: new Date(),
  total_weight: '10',
  policies: [
    {
      address: 'test_policy_address2',
      group_id: 2n,
      admin: 'admin2',
      metadata: 'metadata2',
      version: 1n,
      created_at: new Date(),
      decision_policy: {
        threshold: '5',
      },
    },
  ],
  members: [
    {
      group_id: 2n,
      member: {
        address: 'test_address2',
        weight: '5',
        metadata: 'test_metadata2',
        added_at: new Date(),
      },
    },
    {
      group_id: 2n,
      member: {
        address: 'test_address3',
        weight: '5',
        metadata: 'test_metadata3',
        added_at: new Date(),
      },
    },
  ],
};

export const mockDenom = {
  base: 'TTT',
  display: 'TEST',
  denom_units: [
    { denom: 'utest1', exponent: 0, aliases: ['utest1'] },
    { denom: 'test1', exponent: 6, aliases: ['test1'] },
  ],
  symbol: 'TST',
};

export const mockDenom2 = {
  base: 'TTT2',
  display: 'TEST2',
  denom_units: [
    { denom: 'utest2', exponent: 0, aliases: ['utest2'] },
    { denom: 'test2', exponent: 6, aliases: ['test2'] },
  ],
  symbol: 'TST2',
};

export const mockMfxDenom: ExtendedMetadataSDKType = {
  base: 'umfx',
  display: 'MFX',
  description: 'MFX',
  name: 'MFX',
  denom_units: [
    { denom: 'umfx', exponent: 0, aliases: ['umfx'] },
    { denom: 'mfx', exponent: 6, aliases: ['mfx'] },
  ],
  symbol: 'umfx',
  uri: 'www.someuri.com',
  uri_hash: 's0m3h4sh',
  balance: '2000000',
  totalSupply: '2000000000',
};

export const mockMfxBalance: CombinedBalanceInfo = {
  display: 'mfx',
  base: MFX_TOKEN_BASE,
  amount: '2000000',
  metadata: mockMfxDenom,
};

export const mockFakeMfxDenom = {
  base: 'TEST_umfx_TEST',
  display: 'MFX',
  denom_units: [
    { denom: 'umfx', exponent: 0, aliases: ['umfx'] },
    { denom: 'mfx', exponent: 6, aliases: ['mfx'] },
  ],
  symbol: 'umfx',
};

const { send } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;
const msg = send({
  fromAddress: 'fromaddress123',
  toAddress: 'toaddress321',
  amount: [{ denom: 'ufoof', amount: '42' }],
});
const anyMessage = Any.fromPartial({
  typeUrl: msg.typeUrl,
  value: MsgSend.encode(msg.value).finish(),
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

export const mockProposals: { [key: string]: ProposalSDKType[] } = {
  test_policy_address: [
    {
      id: 1n,
      title: 'mytitle1',
      group_policy_address: 'policy1',
      summary: 'summary1',
      metadata: 'metadata1',
      proposers: ['proposer1'],
      submit_time: new Date(),
      group_version: 1n,
      group_policy_version: 1n,
      status: ProposalStatus.PROPOSAL_STATUS_SUBMITTED,
      final_tally_result: {
        yes_count: '1',
        abstain_count: '0',
        no_count: '0',
        no_with_veto_count: '0',
      },
      voting_period_end: tomorrow,
      executor_result: ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_NOT_RUN,
      messages: [
        {
          ...anyMessage,
          // @ts-ignore
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          $typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          type_url: '/cosmos.bank.v1beta1.MsgSend',
        },
      ],
    },
    {
      id: 2n,
      title: 'mytitle2',
      group_policy_address: 'policy2',
      summary: 'summary2',
      metadata: 'metadata2',
      proposers: ['proposer2'],
      submit_time: new Date(),
      group_version: 1n,
      group_policy_version: 1n,
      status: ProposalStatus.PROPOSAL_STATUS_ACCEPTED,
      final_tally_result: {
        yes_count: '1',
        abstain_count: '0',
        no_count: '0',
        no_with_veto_count: '0',
      },
      voting_period_end: new Date(),
      executor_result: ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_SUCCESS,
      messages: [
        {
          ...anyMessage,
          // @ts-ignore
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          $typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          type_url: '/cosmos.bank.v1beta1.MsgSend',
        },
      ],
    },
  ],
  test_policy_address2: [
    {
      id: 3n,
      title: 'title3',
      group_policy_address: 'policy3',
      summary: 'summary3',
      metadata: 'metadata3',
      proposers: ['proposer3'],
      submit_time: new Date(),
      group_version: 1n,
      group_policy_version: 1n,
      status: ProposalStatus.PROPOSAL_STATUS_REJECTED,
      final_tally_result: {
        yes_count: '0',
        abstain_count: '0',
        no_count: '1',
        no_with_veto_count: '0',
      },
      voting_period_end: new Date(),
      executor_result: ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_FAILURE,
      messages: [],
    },
    {
      id: 4n,
      title: 'title4',
      group_policy_address: 'policy4',
      summary: 'summary4',
      metadata: 'metadata4',
      proposers: ['proposer4'],
      submit_time: new Date(),
      group_version: 1n,
      group_policy_version: 1n,
      status: ProposalStatus.PROPOSAL_STATUS_WITHDRAWN,
      final_tally_result: {
        yes_count: '1',
        abstain_count: '0',
        no_count: '0',
        no_with_veto_count: '0',
      },
      voting_period_end: new Date(),
      executor_result: ProposalExecutorResult.PROPOSAL_EXECUTOR_RESULT_NOT_RUN,
      messages: [],
    },
  ],
};

export const mockVotes = [
  {
    proposal_id: 1n,
    voter: manifestAddr1,
    option: VoteOption.VOTE_OPTION_YES,
    metadata: 'metadata1',
    submit_time: new Date(),
  },
  {
    proposal_id: 1n,
    voter: manifestAddr2,
    option: VoteOption.VOTE_OPTION_YES,
    metadata: 'metadata2',
    submit_time: new Date(),
  },
];

export const mockTally = {
  tally: {
    yes_count: '10',
    no_count: '5',
    abstain_count: '2',
    no_with_veto_count: '1',
  },
};

export const mockMembers: MemberSDKType[] = [
  {
    address: manifestAddr1,
    // @ts-ignore
    name: 'Member 1',
    weight: '1',
  },
  {
    address: manifestAddr2,
    // @ts-ignore
    name: 'Member 2',
    weight: '2',
  },
];

// TODO: Re-use mockDenomMeta1 here
export const mockTokenFormData = {
  name: 'Name Test Token',
  symbol: 'STT',
  display: 'Display Test Token',
  subdenom: 'subtesttoken',
  description: 'This is a test token',
  denomUnits: [
    { denom: 'factory/cosmos1address/subtesttoken', exponent: 0, aliases: [] },
    { denom: 'tt', exponent: 6, aliases: [] },
  ],
  uri: 'https://www.someuri.com',
  uriHash: 's0m3h4sh',
  exponent: '6',
  label: 'LabelTT',
  base: 'BaseTT',
};

export const mockGroupFormData: FormData = {
  title: 'Test Group',
  authors: 'manifest1author',

  description: 'Detailed description of the test group',

  votingPeriod: { seconds: BigInt(3600), nanos: 0 },
  votingThreshold: '2',
  // @ts-ignore
  members: mockMembers,
};
export const mockProposalFormData: ProposalFormData = {
  title: 'Test Proposal',
  proposers: manifestAddr1,
  summary: 'This is a test proposal',
  metadata: {
    title: 'Test Metadata Title',
    authors: 'manifest1author',
    summary: 'This is a test summary',
    details: 'Detailed description of the test proposal',
  },
  messages: [
    {
      type: 'send',
      amount: { denom: 'umfx', amount: '100' },
      to_address: 'manifest1recipient',
      from_address: 'manifest1from',
    },
  ],
};
