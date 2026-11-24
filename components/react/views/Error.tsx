/* eslint-disable @next/next/no-img-element */
import { Dialog } from '@headlessui/react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

import { getRealLogo } from '@/utils';

export const Error = ({
  currentWalletName,
  onClose,
  onReturn,
  onReconnect,
  logo,
}: {
  currentWalletName: string;
  onClose: () => void;
  onReturn: () => void;
  onReconnect: () => void;
  logo: string;
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="mt-3 text-center sm:mt-1.5">
      <div className="flex flex-row items-center justify-between">
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onReturn}
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <Dialog.Title as="h3" className="font-medium leading-6 text-center text-base-content">
          Error
        </Dialog.Title>
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-surface-hover"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col w-full h-full py-6 mt-4 sm:px-8">
        <div className="p-3 border rounded-full border-error mx-auto aspect-square shrink-0">
          <Image
            src={getRealLogo(logo, isDarkMode)}
            alt="Wallet type logo"
            className="shrink-0 w-16 h-16 aspect-square"
            width={16}
            height={16}
          />
        </div>
        <p className="mt-3 font-medium text-base-content">An error has occured</p>
        <p className="mt-1 text-sm text-content-muted">
          You may attempt to reconnect to your {currentWalletName} wallet{' '}
        </p>
        <button
          className="w-[180px] btn btn-error inline-flex justify-center items-center py-2.5 font-medium mt-4 mx-auto"
          onClick={onReconnect}
        >
          <ArrowPathIcon className="shrink-0 w-5 h-5 mr-2 " />
          Reconnect
        </button>
      </div>
    </div>
  );
};
