/* eslint-disable @next/next/no-img-element */
import { ChainWalletBase, ExpiredError, State } from '@cosmos-kit/core';
import { Dialog } from '@headlessui/react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { Suspense, useEffect, useMemo, useState } from 'react';

// Lazy load the QR code component
const QRCode = React.lazy(() => import('../qrCode').then(module => ({ default: module.QRCode })));

// Skeleton loader for QR code
const QRCodeLoader = ({
  logoUrl,
  logoSize,
  message,
}: {
  logoUrl: string;
  logoSize: number;
  message?: string;
}) => (
  <div>
    <div className="w-auto relative p-4 mx-auto rounded-lg h-[280px] flex items-center justify-center">
      <div className="loading w-[8rem] loading-ring text-primary"> </div>
      <div className="absolute flex rounded-lg justify-center">
        <img height={logoSize} src={logoUrl} width={logoSize} alt="Wallet logo" />
      </div>
    </div>

    {message && <p className="text-sm text-content-muted">{message}</p>}
  </div>
);

export const QRCodeView = ({
  onClose,
  onReturn,
  wallet,
}: {
  onClose: () => void;
  onReturn: () => void;
  wallet: ChainWalletBase;
}) => {
  const qrUrl = wallet?.qrUrl;

  // Enhanced error detection
  const isExpired =
    qrUrl?.message === ExpiredError.message ||
    (wallet?.message && wallet.message.includes('Proposal expired'));

  const hasError =
    qrUrl?.state === State.Error ||
    (wallet?.message &&
      (wallet.message.includes('No matching key') ||
        wallet.message.includes('Record was recently deleted') ||
        wallet.message.includes('Proposal expired')));

  const statusDict: Record<State, 'pending' | 'done' | 'error' | 'expired' | undefined> = {
    [State.Pending]: 'pending',
    [State.Done]: 'done',
    [State.Error]: isExpired ? 'expired' : 'error',
    [State.Init]: undefined,
  };

  // If the wallet has an error message, treat it as "error"
  const status = hasError ? 'error' : statusDict[qrUrl?.state ?? State.Init];

  const errorTitle = isExpired ? 'QR Code Expired' : 'Connection Error';
  const errorMessage = isExpired
    ? 'Click to refresh and try again'
    : wallet?.message || qrUrl?.message || 'Failed to establish connection';

  // Add error boundary to handle runtime errors
  const handleRetry = () => {
    try {
      wallet?.connect(false);
    } catch (error) {
      console.error('Retry connection error:', error);
      // Force error state if retry fails
      if (error instanceof Error) {
        wallet.setMessage?.(error.message);
      }
    }
  };

  // If the user specifically expects the QR code but there's no data or recognized status,
  // show a "Re-establishing connection" fallback rather than a blank screen:
  if (!status) {
    return (
      <div className="mt-3 text-center">
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
            onClick={onReturn}
          >
            <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
          </button>
          <Dialog.Title as="h3" className="text-lg font-semibold">
            {wallet?.walletInfo.prettyName}
          </Dialog.Title>
          <button
            type="button"
            className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="w-auto mx-auto mb-3">
          <QRCodeLoader
            message={'Re-establishing connection...'}
            logoUrl={wallet?.walletInfo.logo?.toString() ?? ''}
            logoSize={40}
          />
        </div>
      </div>
    );
  }

  // Normal flow if status = 'error' | 'expired' | 'pending' | 'done':
  return (
    <div className="mt-3 text-center sm:mt-1.5">
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onReturn}
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <Dialog.Title as="h3" className="text-lg font-semibold">
          {wallet?.walletInfo.prettyName}
        </Dialog.Title>
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 mb-4">
        {(status === 'error' || status === 'expired') && (
          <div className="relative flex flex-col items-center justify-center">
            {/* Dimmed QR background */}
            <div className="absolute inset-0 rounded-xl bg-white-high/80" />
            <div className="w-auto p-4 mx-auto rounded-lg opacity-30">
              <QRCode
                value="placeholder"
                size={250}
                logoUrl={wallet?.walletInfo.logo?.toString()}
              />
            </div>
            {/* Error overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <h3 className="text-lg font-semibold">{errorTitle}</h3>
              <p className="text-sm text-content-muted">{errorMessage}</p>
              <div className="flex gap-2">
                <button onClick={handleRetry} className="btn btn-primary">
                  Retry Connection
                </button>
                <button onClick={onReturn} className="btn btn-secondary">
                  Back to Wallet List
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <>
            <QRCodeLoader
              message={'Generating Qr code...'}
              logoUrl={wallet?.walletInfo.logo?.toString() ?? ''}
              logoSize={40}
            />
          </>
        )}

        {status === 'done' && qrUrl?.data && (
          <Suspense
            fallback={
              <QRCodeLoader logoUrl={wallet?.walletInfo.logo?.toString() ?? ''} logoSize={40} />
            }
          >
            <QRCode
              value={qrUrl.data}
              size={220}
              logoUrl={wallet?.walletInfo.logo?.toString()}
              logoSize={40}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};
