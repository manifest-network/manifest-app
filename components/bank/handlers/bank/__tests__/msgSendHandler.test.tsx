import { MsgSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';
import { CoinSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/base/v1beta1/coin';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';

import { HistoryBox } from '@/components/bank/components/historyBox';
import { TxMessage } from '@/components/bank/types';
import { clearAllMocks, mockRouter } from '@/tests';
import { renderWithChainProvider } from '@/tests/render';

import { MsgSendHandler } from '../msgSendHandler';

const createTx = (sender: string, amount: CoinSDKType[], toAddress: string, error?: string) => [
  {
    id: '1',
    message_index: 1,
    type: MsgSend.typeUrl,
    sender,
    mentions: [],
    metadata: {
      amount,
      toAddress,
    },
    fee: { amount: [{ amount: '1', denom: 'utoken' }], gas: '1' },
    memo: '',
    height: 10,
    timestamp: '2023-05-10T12:00:00Z',
    error: error ?? '',
    proposal_ids: [],
  },
];

const render = (tx: TxMessage[]) => {
  renderWithChainProvider(
    <HistoryBox isLoading={false} address="address1" currentPage={1} sendTxs={tx} totalPages={2} />
  );
};

describe('MsgSendHandler', () => {
  beforeEach(() => {
    mockRouter();
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('send success', () => {
    const tx = createTx('address1', [{ amount: '2000000', denom: 'utoken' }], 'address2');
    render(tx);
    expect(screen.getByText(/You sent to/i)).toBeInTheDocument();
    expect(screen.getByText('2 TOKEN')).toBeInTheDocument();
    // Sent amounts are red and received amounts green, so the two read differently at a glance.
    expect(screen.getByText('2 TOKEN').closest('.text-error')).not.toBeNull();
    expect(screen.getByText(/address2/i)).toBeInTheDocument();
  });

  test('send fail', () => {
    const tx = createTx('address1', [{ amount: '2000000', denom: 'utoken' }], 'address2', 'fail!');
    render(tx);
    expect(screen.getByText(/You failed to send to/i)).toBeInTheDocument();
    expect(screen.getByText('2 TOKEN')).toBeInTheDocument();
    expect(screen.getByText(/address2/i)).toBeInTheDocument();
  });

  test('receive', () => {
    const tx = createTx('address2', [{ amount: '2000000', denom: 'utoken' }], 'address1');
    render(tx);
    expect(screen.getByText(/You received from/i)).toBeInTheDocument();
    expect(screen.getByText('2 TOKEN')).toBeInTheDocument();
    expect(screen.getByText('2 TOKEN').closest('.text-success')).not.toBeNull();
    expect(screen.getByText('2 TOKEN').closest('.text-error')).toBeNull();
    expect(screen.getByText(/address2/i)).toBeInTheDocument();
  });

  // TODO: Implement those when https://github.com/manifest-network/manifest-app/pull/285 is merged
  // test('send two denoms', () => {
  //   const tx = createTx(
  //     'address1',
  //     [
  //       { amount: '2000000', denom: 'utoken' },
  //       { amount: '3000000', denom: 'ufoobar' },
  //     ],
  //     'address2'
  //   );
  //   render(tx);
  //   expect(screen.getByText(/You sent to/i)).toBeInTheDocument();
  //   expect(screen.getByText('2 TOKEN, 3 FOOBAR')).toBeInTheDocument();
  //   expect(screen.getByText(/address2/i)).toBeInTheDocument();
  // });
});
