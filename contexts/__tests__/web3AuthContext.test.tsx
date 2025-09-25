import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from 'bun:test';
import React from 'react';

import { clearAllMocks, mockModule } from '@/tests';

import { Web3AuthContext, Web3AuthProvider } from '../web3AuthContext';

describe('Web3AuthContext', () => {
  beforeEach(() => {
    // Mock the required modules
    mockModule('@cosmos-kit/web3auth', () => ({
      makeWeb3AuthWallets: jest.fn().mockReturnValue([]),
      Web3AuthWallet: class MockWeb3AuthWallet {
        walletStatus = 'Disconnected';
        walletInfo = { name: 'test-wallet' };
        client = {
          setLoginHint: jest.fn(),
        };
        async disconnect() {
          return Promise.resolve();
        }
      },
      Web3AuthClient: class MockWeb3AuthClient {
        setLoginHint = jest.fn();
      },
    }));

    mockModule('@web3auth/auth', () => ({
      WEB3AUTH_NETWORK_TYPE: {
        TESTNET: 'testnet',
        MAINNET: 'mainnet',
      },
    }));

    mockModule('cosmos-kit', () => ({
      wallets: {
        for: jest.fn().mockReturnValue([]),
      },
    }));

    mockModule('@cosmos-kit/leap-metamask-cosmos-snap', () => ({
      wallets: [],
    }));

    // Mock environment config
    mockModule('@/config/env', () => ({
      default: {
        web3AuthNetwork: 'testnet',
        web3AuthClientId: 'test-client-id',
      },
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
    jest.clearAllMocks();
  });

  test('provides resetWeb3AuthClients function', () => {
    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      return <div data-testid="reset-type">{typeof context.resetWeb3AuthClients}</div>;
    };

    const { getByTestId } = render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );
    expect(getByTestId('reset-type').textContent).toBe('function');
  });

  test('context provides all required values', () => {
    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      return (
        <div>
          <span data-testid="is-signing">{context.isSigning.toString()}</span>
          <span data-testid="set-signing">{typeof context.setIsSigning}</span>
          <span data-testid="set-prompt">{typeof context.setPromptId}</span>
          <span data-testid="reset-clients">{typeof context.resetWeb3AuthClients}</span>
          <span data-testid="wallets-length">{context.wallets.length}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    expect(getByTestId('is-signing').textContent).toBe('false');
    expect(getByTestId('set-signing').textContent).toBe('function');
    expect(getByTestId('set-prompt').textContent).toBe('function');
    expect(getByTestId('reset-clients').textContent).toBe('function');
    expect(parseInt(getByTestId('wallets-length').textContent || '0')).toBeGreaterThanOrEqual(0);
  });

  test('resetWeb3AuthClients can be called without errors', async () => {
    let resetFunction: (() => Promise<void>) | undefined;

    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      resetFunction = context.resetWeb3AuthClients;
      return <div>test</div>;
    };

    render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    expect(resetFunction).toBeDefined();
    if (resetFunction) {
      // Should not throw
      await expect(resetFunction()).resolves.toBeUndefined();
    }
  });

  test('isSigning state management works correctly', async () => {
    let setSigningFunction: ((isSigning: boolean) => void) | undefined;

    const TestComponentWithState = () => {
      const context = React.useContext(Web3AuthContext);
      setSigningFunction = context.setIsSigning;
      return (
        <div>
          <span data-testid="signing-state">{context.isSigning.toString()}</span>
          <button
            data-testid="toggle-signing"
            onClick={() => context.setIsSigning(!context.isSigning)}
          >
            Toggle
          </button>
        </div>
      );
    };

    const { getByTestId } = render(
      <Web3AuthProvider>
        <TestComponentWithState />
      </Web3AuthProvider>
    );

    // Initial state should be false
    expect(getByTestId('signing-state').textContent).toBe('false');

    // Test state changes by triggering the function
    if (setSigningFunction) {
      setSigningFunction(true);
      await waitFor(() => {
        expect(getByTestId('signing-state').textContent).toBe('true');
      });

      setSigningFunction(false);
      await waitFor(() => {
        expect(getByTestId('signing-state').textContent).toBe('false');
      });
    }
  });

  test('promptId state management works correctly', async () => {
    let setPromptIdFunction: ((promptId: string | undefined) => void) | undefined;

    const TestComponentWithState = () => {
      const context = React.useContext(Web3AuthContext);
      setPromptIdFunction = context.setPromptId;
      return (
        <div>
          <span data-testid="prompt-id">{context.promptId || 'undefined'}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <Web3AuthProvider>
        <TestComponentWithState />
      </Web3AuthProvider>
    );

    // Initial state should be undefined
    expect(getByTestId('prompt-id').textContent).toBe('undefined');

    // Test state changes by triggering the function
    if (setPromptIdFunction) {
      setPromptIdFunction('test-prompt');
      await waitFor(() => {
        expect(getByTestId('prompt-id').textContent).toBe('test-prompt');
      });

      // Clear prompt ID
      setPromptIdFunction(undefined);
      await waitFor(() => {
        expect(getByTestId('prompt-id').textContent).toBe('undefined');
      });
    }
  });

  test('resetWeb3AuthClients handles wallet disconnect errors gracefully', async () => {
    const consoleSpy = spyOn(console, 'warn');

    // Create proper mock classes that extend the originals
    class MockWeb3AuthWallet {
      walletStatus = 'Connected';
      walletInfo = { name: 'error-wallet' };
      client = new MockWeb3AuthClient();

      async disconnect() {
        throw new Error('disconnect failed');
      }
    }

    class MockWeb3AuthClient {
      setLoginHint = jest.fn();
    }

    // Mock the module to return our error wallet
    mockModule.force('@cosmos-kit/web3auth', () => ({
      makeWeb3AuthWallets: jest.fn().mockReturnValue([new MockWeb3AuthWallet()]),
      Web3AuthWallet: MockWeb3AuthWallet,
      Web3AuthClient: MockWeb3AuthClient,
    }));

    let resetFunction: (() => Promise<void>) | undefined;

    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      resetFunction = context.resetWeb3AuthClients;
      return <div>test</div>;
    };

    render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    if (resetFunction) {
      await resetFunction();
      // Should log warning for disconnect failure (line 149)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to disconnect wallet error-wallet:'),
        expect.any(Error)
      );
    }
  });

  test('resetWeb3AuthClients handles general errors', async () => {
    const consoleSpy = spyOn(console, 'error');

    // Create a wallet that will cause an error in the forEach loop
    class MockWeb3AuthWallet {
      walletStatus = 'Connected';
      walletInfo = { name: 'bad-client-wallet' };
      client = new MockWeb3AuthClient();

      async disconnect() {
        return Promise.resolve();
      }
    }

    class MockWeb3AuthClient {
      setLoginHint() {
        throw new Error('setLoginHint failed');
      }
    }

    // Mock the module to trigger error in the first forEach loop
    mockModule.force('@cosmos-kit/web3auth', () => ({
      makeWeb3AuthWallets: jest.fn().mockReturnValue([new MockWeb3AuthWallet()]),
      Web3AuthWallet: MockWeb3AuthWallet,
      Web3AuthClient: MockWeb3AuthClient,
    }));

    let resetFunction: (() => Promise<void>) | undefined;

    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      resetFunction = context.resetWeb3AuthClients;
      return <div>test</div>;
    };

    render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    if (resetFunction) {
      await resetFunction();
      // Should log general error (line 167)
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error resetting Web3Auth clients:',
        expect.any(Error)
      );
    }
  });

  test('setIsSigning handles negative signing count error', async () => {
    const consoleSpy = spyOn(console, 'error');

    let setSigningFunction: ((isSigning: boolean) => void) | undefined;

    const TestComponent = () => {
      const context = React.useContext(Web3AuthContext);
      setSigningFunction = context.setIsSigning;
      return (
        <div>
          <span data-testid="signing-state">{context.isSigning.toString()}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    if (setSigningFunction) {
      // Call setIsSigning(false) multiple times to trigger negative count
      setSigningFunction(false);
      setSigningFunction(false);
      setSigningFunction(false);

      await waitFor(() => {
        // Should log error about negative signing count (lines 154-162)
        expect(consoleSpy).toHaveBeenCalledWith('signingCount is negative, this should not happen');
      });

      // State should remain false
      expect(getByTestId('signing-state').textContent).toBe('false');
    }
  });
});
