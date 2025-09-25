/* eslint-disable @next/next/no-img-element */
/**
 * TailwindModal
 *
 * This component handles the wallet connection modal, displaying different views
 * based on the current wallet status or user actions.
 *
 * It includes logic for:
 *  - Displaying a wallet list (with browser or social login options).
 *  - Handling Email / SMS flows (which need extra input / login hints).
 *  - Handling WalletConnect QR codes for desktop usage (to scan using a mobile device).
 *  - Handling various error states (NotExist, Connection Errors, Provider Errors, etc.).
 *
 * The code below is refactored for better readability and composability, especially around
 * the onWalletClicked() function (which is the main handler for selecting / connecting to wallets).
 */
import { State } from '@cosmos-kit/core';
import { Web3AuthClient, Web3AuthWallet } from '@cosmos-kit/web3auth';
import { Dialog, Portal, Transition } from '@headlessui/react';
import type { ChainWalletBase, WalletModalProps } from 'cosmos-kit';
import { WalletStatus } from 'cosmos-kit';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import { ToastProvider } from '@/contexts/toastContext';
import { useDeviceDetect } from '@/hooks';
import { useClientReset } from '@/hooks/useClientReset';

import {
  Connected,
  Connecting,
  EmailInput,
  Error,
  NotExist,
  QRCodeView,
  SMSInput,
  WalletList,
} from './views';

export enum ModalView {
  WalletList,
  QRCode,
  Connecting,
  Connected,
  Error,
  NotExist,
  EmailInput,
  SMSInput,
}

// Add new error types
const WALLET_ERRORS = {
  NO_MATCHING_KEY: 'No matching key',
  PROPOSAL_EXPIRED: 'Proposal expired',
  RECORD_DELETED: 'Record was recently deleted',
} as const;

/**
 * Helper to check if an error message matches known wallet connection errors
 */
const isWalletConnectionError = (message?: string): boolean => {
  if (!message) return false;
  return (
    message.includes(WALLET_ERRORS.NO_MATCHING_KEY) ||
    message.includes(WALLET_ERRORS.PROPOSAL_EXPIRED) ||
    message.includes(WALLET_ERRORS.RECORD_DELETED)
  );
};

export const TailwindModal: React.FC<
  WalletModalProps & {
    showMemberManagementModal?: boolean;
    showMessageEditModal?: boolean;
  }
> = ({ isOpen, setOpen, walletRepo, showMessageEditModal = false }) => {
  const [currentView, setCurrentView] = useState<ModalView>(ModalView.WalletList);
  const [qrWallet, setQRWallet] = useState<ChainWalletBase | undefined>();
  const [selectedWallet, setSelectedWallet] = useState<ChainWalletBase | undefined>();
  const [qrState, setQRState] = useState<State>(State.Init);
  const [qrMessage, setQrMessage] = useState<string>('');

  const current = walletRepo?.current;
  const currentWalletData = current?.walletInfo;
  const walletStatus = current?.walletStatus || WalletStatus.Disconnected;
  const currentWalletName = current?.walletName;
  const { isMobile } = useDeviceDetect();
  const { forceCompleteReset } = useClientReset();

  useEffect(() => {
    if (isOpen) {
      switch (walletStatus) {
        case WalletStatus.Disconnected:
          setCurrentView(ModalView.WalletList);
          break;
        case WalletStatus.Connecting:
          if (current?.walletInfo.mode === 'wallet-connect' && !isMobile) {
            setCurrentView(ModalView.QRCode);
          } else {
            setCurrentView(ModalView.Connecting);
          }
          break;
        case WalletStatus.Connected:
          setCurrentView(ModalView.Connected);
          break;
        case WalletStatus.Error:
          setCurrentView(ModalView.Error);
          break;
        case WalletStatus.Rejected:
          setCurrentView(ModalView.Error);
          break;
        case WalletStatus.NotExist:
          setCurrentView(ModalView.NotExist);
          break;
      }
    }
  }, [isOpen, walletStatus, currentWalletName, current?.walletInfo.mode, isMobile]);

  /**
   * Handle the lifecycle for QR Code actions.
   * When the view is QRCode and qrWallet is set, we tie the qrUrl's state updates
   * and error events to our local states (qrState, qrMessage).
   */
  useEffect(() => {
    if (currentView === ModalView.QRCode && qrWallet) {
      // The .setActions() is a special method from the wallet client to listen for
      // QR URL changes, errors, and messages that might occur during the handshake.
      (qrWallet.client as any)?.setActions?.({
        qrUrl: {
          state: (s: State) => setQRState(s),
          message: (msg: string) => setQrMessage(msg),
        },
        onError: (err: Error) => {
          if (err.message?.includes('No matching key')) {
            setQRState(State.Error);
            setQrMessage(err.message);
            qrWallet.setMessage?.(err.message);
          }
        },
      });
    }
  }, [currentView, qrWallet, setQrMessage, setQRState]);

  /**
   * Helper to handle Email or SMS wallet flows.
   * These wallets need user input (email or phone), so we switch views accordingly.
   */
  const handleEmailOrSmsIfNeeded = useCallback((wallet: ChainWalletBase | undefined): boolean => {
    if (!wallet) return false;

    const { prettyName } = wallet.walletInfo;

    // If the wallet is "Email" or "SMS", we set appropriate inputs.
    if (prettyName === 'Email') {
      setCurrentView(ModalView.EmailInput);
      return true;
    }
    if (prettyName === 'SMS') {
      setCurrentView(ModalView.SMSInput);
      return true;
    }
    return false;
  }, []);

  /**
   * Helper to handle extension that doesn't fully register as 'NotExist'
   * in the standard wallet flow. We force set the view to NotExist if we detect the error message.
   */
  const handleWalletNotExists = (wallet: ChainWalletBase) => {
    if (wallet?.isWalletNotExist) {
      setCurrentView(ModalView.NotExist);
      setSelectedWallet(wallet);
      return true;
    }

    return false;
  };

  /**
   * Connect with a wallet that has 'wallet-connect' mode.
   * For desktop: show the QR code for scanning from a mobile device.
   * For an actual mobile device: skip QR code and proceed connecting directly.
   */
  const handleWalletConnectFlow = useCallback(
    (wallet: ChainWalletBase, name: string) => {
      // If user is already on a mobile device, do not display QR code.
      if (isMobile) {
        setCurrentView(ModalView.Connecting);
        walletRepo?.connect(name).catch(error => {
          console.error('Wallet connection error:', error);
          // Check for specific wallet errors
          if (isWalletConnectionError(error?.message)) {
            setQRState(State.Error);
            setQrMessage(error.message);
          }
          setCurrentView(ModalView.Error);
        });
        return;
      }

      // Show QR code for desktop, so the user can scan with their mobile wallet.
      setQRWallet(wallet);
      setCurrentView(ModalView.QRCode);

      walletRepo
        ?.connect(name)
        .then(() => {
          if (wallet?.walletStatus === WalletStatus.Connected) {
            setCurrentView(ModalView.Connected);
          }
        })
        .catch(error => {
          console.error('Wallet connection error:', error);
          // Always keep QRCode view but upgrade its state for these errors
          if (isWalletConnectionError(error?.message)) {
            setQRState(State.Error);
            setQrMessage(error.message);
          } else {
            // For other errors, show the Error view
            setCurrentView(ModalView.Error);
          }
        });
    },
    [isMobile, walletRepo]
  );

  /**
   * For wallets that do not use 'wallet-connect',
   * we simply show "Connecting" while the connection is established,
   * then on success, we switch to "Connected" or "Error" if it fails/times out.
   */
  const handleStandardWalletFlow = useCallback(
    (wallet: ChainWalletBase, name: string) => {
      setQRWallet(undefined);
      setCurrentView(ModalView.Connecting);

      const timeoutId = setTimeout(() => {
        if (wallet?.walletStatus === WalletStatus.Connecting) {
          wallet.disconnect();
          setCurrentView(ModalView.Error);
        }
      }, 30000);

      walletRepo
        ?.connect(name)
        .catch(error => {
          console.error('Wallet connection error:', error);
          setCurrentView(ModalView.Error);
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
    },
    [walletRepo]
  );

  /**
   * The main handler for clicking on a wallet in the WalletList.
   * 1) We fetch the wallet from walletRepo by name.
   * 2) Check for Email / SMS (special flow).
   * 3) Reset clients if connecting to a social wallet and already have a connected address.
   * 4) Delay a bit (setTimeout) to handle a special metamask extension error check.
   * 5) Depending on wallet mode, proceed with "wallet-connect" or normal flow.
   */
  const onWalletClicked = useCallback(
    async (name: string) => {
      const wallet = walletRepo?.getWallet(name);
      if (!wallet) return;

      // Step 1: Check for Email or SMS. If found, we set the corresponding view & exit.
      if (handleEmailOrSmsIfNeeded(wallet)) {
        return;
      }

      // Step 2: Check if this is a social wallet and if we should reset clients
      // Step 3: Special case for keplr - check immediately
      if (
        wallet?.walletInfo.name === 'keplr-extension' &&
        typeof window !== 'undefined' &&
        !window.keplr
      ) {
        setCurrentView(ModalView.NotExist);
        setSelectedWallet(wallet);
        return;
      }

      // Step 4: We do a small setTimeout to check for metamask extension error
      // or if the wallet doesn't exist. This ensures the error message has time
      // to populate in the wallet's state after calling `getWallet()`.
      setTimeout(() => {
        if (handleWalletNotExists(wallet)) {
          return;
        }

        // Step 5: If the wallet is "wallet-connect" style, handle phone vs. desktop flows
        if (wallet?.walletInfo.mode === 'wallet-connect') {
          handleWalletConnectFlow(wallet, name);
          return;
        }

        // Step 6: Otherwise, handle standard extension or browser-based wallet
        handleStandardWalletFlow(wallet, name);
      }, 0);
    },
    [walletRepo, handleEmailOrSmsIfNeeded, handleWalletConnectFlow, handleStandardWalletFlow]
  );

  /**
   * Whenever the modal closes, if we had a QR wallet that was mid-connection, we disconnect it.
   * We also reset the QR states, so next time we open it, it's fresh.
   */
  useEffect(() => {
    if (!isOpen) {
      if (qrWallet?.walletStatus === WalletStatus.Connecting) {
        qrWallet.disconnect();
        setQRWallet(undefined);
      }
      setQRState(State.Init);
      setQrMessage('');
    }
  }, [isOpen, qrWallet]);

  /**
   * Called whenever the user closes the modal.
   * If there's a wallet in "Connecting" state, we want to disconnect it before closing.
   */
  const onCloseModal = useCallback(() => {
    if (qrWallet?.walletStatus === WalletStatus.Connecting) {
      qrWallet.disconnect();
    }
    setOpen(false);
  }, [setOpen, qrWallet]);

  /**
   * If the user clicks "Back to Wallet List" while a QR code is displayed,
   * and the wallet is mid-connection, we disconnect. Then we reset the QrWallet
   * and show the wallet list.
   */
  const onReturnToWalletList = useCallback(() => {
    if (qrWallet?.walletStatus === WalletStatus.Connecting) {
      qrWallet.disconnect();
      setQRWallet(undefined);
    }
    setCurrentView(ModalView.WalletList);
  }, [qrWallet]);

  /**
   * Decide what to render based on currentView.
   * We have:
   *  - WalletList (default)
   *  - EmailInput, SMSInput (social login flows)
   *  - Connected, Connecting
   *  - QRCode
   *  - Error, NotExist
   */
  const _render = useMemo(
    () => {
      switch (currentView) {
        case ModalView.WalletList:
          return (
            <WalletList
              onClose={onCloseModal}
              onWalletClicked={onWalletClicked}
              wallets={walletRepo?.wallets || []}
            />
          );

        case ModalView.EmailInput:
          return (
            <EmailInput
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              onSubmit={async email => {
                try {
                  const emailWallet = walletRepo?.wallets.find(
                    w => w.walletInfo.prettyName === 'Email'
                  ) as Web3AuthWallet | undefined;

                  if (emailWallet?.client instanceof Web3AuthClient) {
                    // Provide the user's email to the client before connecting
                    emailWallet.client.setLoginHint(email);
                    await walletRepo?.connect(emailWallet.walletInfo.name);
                  } else {
                    console.error('Email wallet or client not found');
                  }
                } catch (error) {
                  console.error('Email login error:', error);
                }
              }}
            />
          );

        case ModalView.SMSInput:
          return (
            <SMSInput
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              onSubmit={phone => {
                const smsWallet = walletRepo?.wallets.find(
                  w => w.walletInfo.prettyName === 'SMS'
                ) as Web3AuthWallet | undefined;

                if (smsWallet?.client instanceof Web3AuthClient) {
                  // Provide the user's phone number to the client before connecting
                  smsWallet.client.setLoginHint(phone);
                  walletRepo?.connect(smsWallet.walletInfo.name);
                }
              }}
            />
          );

        case ModalView.Connected:
          return (
            <Connected
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              disconnect={() => {
                current?.disconnect();
                forceCompleteReset();
              }}
              name={currentWalletData?.prettyName!}
              logo={currentWalletData?.logo!.toString() ?? ''}
              username={current?.username}
              address={current?.address}
            />
          );

        case ModalView.Connecting:
          // Decide a tailored message if it's a WalletConnect flow
          let subtitle: string;
          if (currentWalletData!?.mode === 'wallet-connect') {
            subtitle = `Approve ${currentWalletData!.prettyName} connection request on your mobile device.`;
          } else {
            subtitle = `Open the ${
              currentWalletData!?.prettyName
            } browser extension to connect your wallet.`;
          }
          return (
            <Connecting
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              name={currentWalletData?.prettyName!}
              logo={currentWalletData?.logo!.toString() ?? ''}
              title="Requesting Connection"
              subtitle={subtitle}
            />
          );

        case ModalView.QRCode:
          return (
            <QRCodeView onClose={onCloseModal} onReturn={onReturnToWalletList} wallet={qrWallet!} />
          );

        case ModalView.Error:
          return (
            <Error
              currentWalletName={currentWalletName ?? ''}
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              logo={currentWalletData?.logo!.toString() ?? ''}
              onReconnect={() => onWalletClicked(currentWalletData?.name!)}
            />
          );

        case ModalView.NotExist:
          return (
            <NotExist
              onClose={onCloseModal}
              onReturn={() => setCurrentView(ModalView.WalletList)}
              onInstall={() => {
                const link = selectedWallet?.downloadInfo?.link;
                if (link) window.open(link, '_blank', 'noopener,noreferrer');
              }}
              logo={selectedWallet?.walletInfo.logo?.toString() ?? ''}
              name={selectedWallet?.walletInfo.prettyName ?? ''}
            />
          );

        default:
          // A fallback if we are syncing or re-connecting
          return (
            <div className="flex flex-col items-center justify-center p-6 gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reconnecting your wallet...
              </p>
              <div className="loading loading-ring w-8 h-8 text-primary" />
            </div>
          );
      }
    },
    // `qrState` and `qrMessage` are used to detect changes in their string content,
    // so we need to include them in the dependencies array even if they're not used.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentView,
      onCloseModal,
      onWalletClicked,
      walletRepo,
      currentWalletData,
      current,
      showMessageEditModal,
      selectedWallet,
      qrState,
      qrMessage,
      qrWallet,
      onReturnToWalletList,
      currentWalletName,
    ]
  );

  /**
   * Render the Modal with transitions. We wrap our entire view in ToastProvider
   * to ensure we can display toast messages if needed.
   */
  return (
    <Portal>
      <Transition.Root show={isOpen}>
        <Dialog as="div" className="relative z-50" onClose={onCloseModal}>
          <div className="fixed inset-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40  transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel
                    className={`relative transform overflow-hidden rounded-xl dark:bg-[#1D192D] bg-[#FFFF] px-4 pt-2.5 pb-4 [min-height:18rem] text-left shadow-xl transition-all sm:my-8 sm:w-full ${
                      currentView === ModalView.WalletList ? 'sm:max-w-sm' : 'sm:max-w-2xl'
                    } sm:p-4`}
                  >
                    <ToastProvider>
                      <div className="h-full">{_render}</div>
                    </ToastProvider>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </Portal>
  );
};
