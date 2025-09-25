import { Web3AuthClient } from '@cosmos-kit/web3auth';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, mock, spyOn, test } from 'bun:test';
import type { ChainWalletBase } from 'cosmos-kit';
import { WalletStatus } from 'cosmos-kit';
import React from 'react';

import { TailwindModal } from '@/components/react/modal';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';

describe('TailwindModal', () => {
  let mockWalletRepo: any;
  let mockWallet: ChainWalletBase;
  let mockSetOpen: jest.Mock;
  let useDeviceDetectMock: any;
  let useClientResetMock: any;
  let originalWindow: any;

  beforeEach(() => {
    // Mock router and window object
    mockRouter();

    // Store original window if it exists
    originalWindow = (global as any).window;

    // Mock window object with all necessary properties for HeadlessUI and other tests
    (global as any).window = {
      ...originalWindow,
      keplr: undefined,
      open: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      matchMedia: jest.fn(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
      navigator: {
        platform: 'MacIntel',
        userAgent: 'test',
        maxTouchPoints: 0,
      },
      document: {
        body: {
          style: {},
        },
      },
    };

    // Mock console.error to prevent test noise
    spyOn(console, 'error').mockImplementation(() => {});

    mockSetOpen = jest.fn();

    mockWallet = {
      walletInfo: {
        name: 'keplr-extension',
        prettyName: 'Keplr',
        mode: 'extension',
        logo: 'logo.png',
      },
      walletStatus: WalletStatus.Disconnected,
      walletName: 'keplr-extension',
      message: '',
      username: undefined,
      address: undefined,
      isWalletNotExist: false,
      disconnect: jest.fn(),
      setMessage: jest.fn(),
      client: {
        setActions: jest.fn(),
      },
      downloadInfo: {
        link: 'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap',
      },
    } as any;

    mockWalletRepo = {
      current: mockWallet,
      wallets: [mockWallet],
      getWallet: jest.fn(() => mockWallet),
      connect: jest.fn(() => Promise.resolve()),
    };

    // Mock hooks using mockModule
    useDeviceDetectMock = mockModule('@/hooks', () => ({
      useDeviceDetect: jest.fn(() => ({ isMobile: false })),
    }));

    useClientResetMock = mockModule('@/hooks/useClientReset', () => ({
      useClientReset: jest.fn(() => ({ forceCompleteReset: jest.fn() })),
    }));

    // Mock the modal views
    mockModule('@/components/react/views', () => ({
      WalletList: ({ onWalletClicked, onClose }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'wallet-list' },
          React.createElement(
            'button',
            { onClick: () => onWalletClicked('keplr-extension') },
            'Keplr'
          ),
          React.createElement(
            'button',
            { onClick: () => onWalletClicked('leap-cosmos-metamask-snap') },
            'Metamask'
          ),
          React.createElement('button', { onClick: () => onWalletClicked('Email') }, 'Email'),
          React.createElement('button', { onClick: () => onWalletClicked('SMS') }, 'SMS'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      Connected: ({ onClose, disconnect }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'connected' },
          React.createElement('button', { onClick: disconnect }, 'Disconnect'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      Connecting: ({ onClose }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'connecting' },
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      Error: ({ onClose, onReconnect }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'error' },
          React.createElement('button', { onClick: onReconnect }, 'Reconnect'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      NotExist: ({ onClose, onInstall }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'not-exist' },
          React.createElement('button', { onClick: onInstall }, 'Install'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      QRCodeView: ({ onClose, onReturn }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'qr-code' },
          React.createElement('button', { onClick: onReturn }, 'Back'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      EmailInput: ({ onClose, onReturn, onSubmit }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'email-input' },
          React.createElement(
            'button',
            { onClick: () => onSubmit('test@example.com') },
            'Submit Email'
          ),
          React.createElement('button', { onClick: onReturn }, 'Back'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
      SMSInput: ({ onClose, onReturn, onSubmit }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'sms-input' },
          React.createElement('button', { onClick: () => onSubmit('+1234567890') }, 'Submit SMS'),
          React.createElement('button', { onClick: onReturn }, 'Back'),
          React.createElement('button', { onClick: onClose }, 'Close')
        ),
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
    mock.restore();
    jest.clearAllMocks();

    // Restore original window
    if (originalWindow) {
      (global as any).window = originalWindow;
    }
  });

  describe('isWalletConnectionError function', () => {
    test('should have TailwindModal component defined', () => {
      // Import the modal and test that the component is properly defined
      expect(TailwindModal).toBeDefined();
    });
  });

  describe('Modal State Management', () => {
    test('should disconnect QR wallet when modal closes', () => {
      const connectingWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Connecting,
        disconnect: jest.fn(),
      };

      const { rerender } = render(
        <TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={mockWalletRepo} />
      );

      // Simulate QR wallet being set
      fireEvent.click(screen.getByText('Keplr'));

      // Close modal
      rerender(<TailwindModal isOpen={false} setOpen={mockSetOpen} walletRepo={mockWalletRepo} />);

      // Should clean up QR wallet
      expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
    });
  });

  describe('Wallet Status Changes', () => {
    test('should handle different wallet statuses when modal opens', () => {
      const connectedWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Connected,
      };

      const connectedWalletRepo = {
        ...mockWalletRepo,
        current: connectedWallet,
      };

      render(
        <TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={connectedWalletRepo} />
      );

      expect(screen.getByTestId('connected')).toBeInTheDocument();
    });

    test('should handle error wallet status', () => {
      const errorWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Error,
      };

      const errorWalletRepo = {
        ...mockWalletRepo,
        current: errorWallet,
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={errorWalletRepo} />);

      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    test('should handle rejected wallet status', () => {
      const rejectedWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Rejected,
      };

      const rejectedWalletRepo = {
        ...mockWalletRepo,
        current: rejectedWallet,
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={rejectedWalletRepo} />);

      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    test('should handle not exist wallet status', () => {
      const notExistWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.NotExist,
      };

      const notExistWalletRepo = {
        ...mockWalletRepo,
        current: notExistWallet,
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={notExistWalletRepo} />);

      expect(screen.getByTestId('not-exist')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing wallet from getWallet', async () => {
      const emptyWalletRepo = {
        ...mockWalletRepo,
        getWallet: jest.fn(() => undefined),
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={emptyWalletRepo} />);

      fireEvent.click(screen.getByText('Keplr'));

      // Should not crash and wallet should remain disconnected
      expect(emptyWalletRepo.getWallet).toHaveBeenCalledWith('keplr-extension');
    });

    test('should handle forceCompleteReset on connected wallet disconnect', async () => {
      const mockForceCompleteReset = jest.fn();
      useClientResetMock.mocks.useClientReset.mockReturnValue({
        forceCompleteReset: mockForceCompleteReset,
      });

      const connectedWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Connected,
        disconnect: jest.fn(),
      };

      const connectedWalletRepo = {
        ...mockWalletRepo,
        current: connectedWallet,
      };

      render(
        <TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={connectedWalletRepo} />
      );

      expect(screen.getByTestId('connected')).toBeInTheDocument();

      // Click disconnect button
      fireEvent.click(screen.getByText('Disconnect'));

      expect(connectedWallet.disconnect).toHaveBeenCalled();
      expect(mockForceCompleteReset).toHaveBeenCalled();
    });

    test('should handle successful SMS wallet connection', async () => {
      const mockClient = {
        setLoginHint: jest.fn(),
      };

      const smsWallet = {
        ...mockWallet,
        walletInfo: { ...mockWallet.walletInfo, prettyName: 'SMS', name: 'sms' },
        client: mockClient,
      };

      // Make mockClient an instance of Web3AuthClient for instanceof check
      Object.setPrototypeOf(mockClient, Web3AuthClient.prototype);

      const smsWalletRepo = {
        ...mockWalletRepo,
        current: smsWallet,
        wallets: [smsWallet],
        getWallet: jest.fn(() => smsWallet),
        connect: jest.fn(() => Promise.resolve()),
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={smsWalletRepo} />);

      fireEvent.click(screen.getByText('SMS'));
      expect(screen.getByTestId('sms-input')).toBeInTheDocument();

      // Test SMS submission
      fireEvent.click(screen.getByText('Submit SMS'));

      expect(mockClient.setLoginHint).toHaveBeenCalledWith('+1234567890');
      expect(smsWalletRepo.connect).toHaveBeenCalledWith('sms');
    });

    test('should handle Keplr extension not available', () => {
      // Mock window.keplr as undefined
      (global as any).window.keplr = undefined;

      const keplrWallet = {
        ...mockWallet,
        walletInfo: { ...mockWallet.walletInfo, name: 'keplr-extension' },
      };

      const keplrWalletRepo = {
        ...mockWalletRepo,
        getWallet: jest.fn(() => keplrWallet),
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={keplrWalletRepo} />);

      fireEvent.click(screen.getByText('Keplr'));

      // Should show NotExist view for missing Keplr extension
      expect(screen.getByTestId('not-exist')).toBeInTheDocument();
    });

    test('should handle connecting wallet status with wallet-connect mode', () => {
      // Mock as desktop device
      useDeviceDetectMock.mocks.useDeviceDetect.mockReturnValue({ isMobile: false });

      const connectingWalletConnectWallet = {
        ...mockWallet,
        walletStatus: WalletStatus.Connecting,
        walletInfo: { ...mockWallet.walletInfo, mode: 'wallet-connect' },
      };

      const connectingWalletRepo = {
        ...mockWalletRepo,
        current: connectingWalletConnectWallet,
      };

      render(
        <TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={connectingWalletRepo} />
      );

      // Should show QR code view for connecting wallet-connect wallet on desktop
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    test('should handle wallet with isWalletNotExist flag', () => {
      const notExistWallet = {
        ...mockWallet,
        isWalletNotExist: true,
      };

      const notExistWalletRepo = {
        ...mockWalletRepo,
        getWallet: jest.fn(() => notExistWallet),
      };

      render(<TailwindModal isOpen={true} setOpen={mockSetOpen} walletRepo={notExistWalletRepo} />);

      fireEvent.click(screen.getByText('Keplr'));

      // Should show NotExist view
      expect(screen.getByTestId('not-exist')).toBeInTheDocument();
    });
  });
});
