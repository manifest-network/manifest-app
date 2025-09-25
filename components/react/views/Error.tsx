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
          className="p-2 text-primary bg-neutral rounded-full hover:bg-gray-200 dark:hover:bg-[#00000033]"
          onClick={onReturn}
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <Dialog.Title
          as="h3"
          className="font-medium leading-6 text-center text-gray-900 dark:text-white"
        >
          Error
        </Dialog.Title>
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-gray-200 dark:hover:bg-[#00000033]"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col w-full h-full py-6 mt-4 sm:px-8">
        <div className="p-3 border rounded-full border-red-600 mx-auto aspect-1 shrink-0">
          <Image
            src={
              currentWalletName === 'Leap Cosmos MetaMask'
                ? '/metamask.svg'
                : getRealLogo(logo, isDarkMode)
            }
            alt="Wallet type logo"
            className="shrink-0 w-16 h-16 aspect-1"
            width={16}
            height={16}
          />
        </div>
        <p className="mt-3 font-medium text-black dark:text-white">An error has occured</p>
        <p className="mt-1 text-sm text-gray-500">
          You may attempt to reconnect to your {currentWalletName} wallet{' '}
        </p>
        <button
          className="rounded-lg w-[180px] btn btn-error  inline-flex justify-center items-center py-2.5 font-medium mt-4 bg-mint mx-auto text-black dark:text-white"
          onClick={onReconnect}
        >
          <ArrowPathIcon className="shrink-0 w-5 h-5 mr-2 " />
          Reconnect
        </button>
      </div>
    </div>
  );
};
